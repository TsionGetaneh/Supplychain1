½Ufrom flask import Flask, request, jsonify, render_template, send_from_directory
import os
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F
from torchvision import transforms
import base64
import io
import json
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create necessary directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

class VirtualTryOnPipeline:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.image_size = (256, 192)
        self.transform = transforms.Compose([
            transforms.Resize(self.image_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
        ])
        
    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        image = Image.open(image_path).convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0)
        return image_tensor.to(self.device), image
    
    def detect_body_keypoints(self, image):
        """Simple body keypoint detection using OpenCV"""
        # Convert to grayscale
        gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
        
        # Use face detection as a proxy for body positioning
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # Estimate body regions based on face position
        h, w = gray.shape
        if len(faces) > 0:
            x, y, face_w, face_h = faces[0]
            # Estimate body regions
            shoulders_y = y + face_h + int(face_h * 0.3)
            chest_y = shoulders_y + int(face_h * 0.5)
            waist_y = chest_y + int(face_h * 0.8)
            
            return {
                'face': (x, y, face_w, face_h),
                'shoulders': (x - int(face_w * 0.3), shoulders_y, int(face_w * 1.6), int(face_h * 0.4)),
                'chest': (x - int(face_w * 0.4), chest_y, int(face_w * 1.8), int(face_h * 0.6)),
                'waist': (x - int(face_w * 0.3), waist_y, int(face_w * 1.6), int(face_h * 0.4))
            }
        else:
            # Default positions if no face detected
            return {
                'face': (w//4, h//8, w//2, h//4),
                'shoulders': (w//5, h//3, w*3//5, h//6),
                'chest': (w//6, h//2, w*2//3, h//4),
                'waist': (w//5, h*2//3, w*3//5, h//6)
            }
    
    def extract_clothing_region(self, clothing_image, body_keypoints):
        """Extract and prepare clothing region"""
        clothing_array = np.array(clothing_image)
        h, w = clothing_array.shape[:2]
        
        # Create mask for clothing (assuming clothing is the main object)
        gray = cv2.cvtColor(clothing_array, cv2.COLOR_RGB2GRAY)
        _, mask = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
        
        # Clean up mask
        kernel = np.ones((5,5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        
        return mask
    
    def warp_clothing_to_body(self, clothing_image, person_image, body_keypoints):
        """Warp clothing to fit body shape"""
        clothing_array = np.array(clothing_image)
        person_array = np.array(person_image)
        
        h, w = person_array.shape[:2]
        
        # Get clothing mask
        clothing_mask = self.extract_clothing_region(clothing_image, body_keypoints)
        
        # Estimate warp points based on body keypoints
        src_points = np.float32([
            [0, 0],  # top-left
            [clothing_array.shape[1], 0],  # top-right
            [clothing_array.shape[1], clothing_array.shape[0]],  # bottom-right
            [0, clothing_array.shape[0]]  # bottom-left
        ])
        
        # Map to body regions
        chest = body_keypoints['chest']
        dst_points = np.float32([
            [chest[0], chest[1]],  # top-left of chest
            [chest[0] + chest[2], chest[1]],  # top-right of chest
            [chest[0] + chest[2], chest[1] + chest[3]],  # bottom-right of chest
            [chest[0], chest[1] + chest[3]]  # bottom-left of chest
        ])
        
        # Calculate perspective transform
        M = cv2.getPerspectiveTransform(src_points, dst_points)
        warped_clothing = cv2.warpPerspective(clothing_array, M, (w, h))
        warped_mask = cv2.warpPerspective(clothing_mask, M, (w, h))
        
        return warped_clothing, warped_mask
    
    def blend_clothing_with_person(self, person_image, warped_clothing, warped_mask, body_keypoints):
        """Blend clothing onto person while preserving identity"""
        person_array = np.array(person_image).copy()
        
        # Create refined mask for clothing region
        mask_3d = np.stack([warped_mask/255.0] * 3, axis=2)
        
        # Apply clothing only to upper body region
        chest = body_keypoints['chest']
        shoulders = body_keypoints['shoulders']
        
        # Create region mask for upper body
        region_mask = np.zeros(person_array.shape[:2], dtype=np.uint8)
        
        # Combine chest and shoulder regions
        cv2.rectangle(region_mask, 
                     (shoulders[0], shoulders[1]), 
                     (shoulders[0] + shoulders[2], chest[1] + chest[3]), 
                     255, -1)
        
        # Smooth the mask edges
        region_mask = cv2.GaussianBlur(region_mask, (15, 15), 0)
        region_mask_3d = np.stack([region_mask/255.0] * 3, axis=2)
        
        # Final mask combining clothing and region
        final_mask = mask_3d * region_mask_3d
        
        # Blend clothing with person
        result_array = person_array * (1 - final_mask) + warped_clothing * final_mask
        
        # Add natural shadows and highlights
        result_array = self.add_realistic_lighting(result_array, warped_clothing, final_mask)
        
        return Image.fromarray(result_array.astype(np.uint8))
    
    def add_realistic_lighting(self, result_array, clothing_array, mask):
        """Add realistic lighting effects"""
        # Simple lighting enhancement
        gray_clothing = cv2.cvtColor(clothing_array, cv2.COLOR_RGB2GRAY)
        
        # Create subtle shadow effect
        shadow = cv2.GaussianBlur(gray_clothing, (21, 21), 0)
        shadow = shadow / 255.0 * 0.3  # Subtle shadow
        
        # Apply shadow where clothing exists
        for i in range(3):
            result_array[:,:,i] = result_array[:,:,i] * (1 - mask[:,:,i] * shadow * 0.2)
        
        return result_array
    
    def process_try_on(self, person_path, clothing_path):
        """Main virtual try-on processing pipeline"""
        try:
            # Load images
            person_image = Image.open(person_path).convert('RGB')
            clothing_image = Image.open(clothing_path).convert('RGB')
            
            # Resize person to standard size
            person_image = person_image.resize((512, 640), Image.LANCZOS)
            clothing_image = clothing_image.resize((512, 640), Image.LANCZOS)
            
            # Detect body keypoints
            body_keypoints = self.detect_body_keypoints(person_image)
            
            # Warp clothing to body shape
            warped_clothing, warped_mask = self.warp_clothing_to_body(
                clothing_image, person_image, body_keypoints
            )
            
            # Blend clothing with person
            result_image = self.blend_clothing_with_person(
                person_image, warped_clothing, warped_mask, body_keypoints
            )
            
            return result_image
            
        except Exception as e:
            print(f"Error in virtual try-on pipeline: {e}")
            # Return original person image if processing fails
            return Image.open(person_path).convert('RGB')

# Initialize the pipeline
try_on_pipeline = VirtualTryOnPipeline()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/try_on', methods=['POST'])
def try_on():
    try:
        # Check if files are present
        if 'person_image' not in request.files or 'clothing_image' not in request.files:
            return jsonify({'error': 'Both person and clothing images are required'}), 400
        
        person_file = request.files['person_image']
        clothing_file = request.files['clothing_image']
        
        if person_file.filename == '' or clothing_file.filename == '':
            return jsonify({'error': 'No selected files'}), 400
        
        # Generate unique filenames
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        person_filename = f"person_{timestamp}_{unique_id}.jpg"
        clothing_filename = f"clothing_{timestamp}_{unique_id}.jpg"
        output_filename = f"result_{timestamp}_{unique_id}.jpg"
        
        # Save uploaded files
        person_path = os.path.join(app.config['UPLOAD_FOLDER'], person_filename)
        clothing_path = os.path.join(app.config['UPLOAD_FOLDER'], clothing_filename)
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        person_file.save(person_path)
        clothing_file.save(clothing_path)
        
        # Process virtual try-on
        result_image = try_on_pipeline.process_try_on(person_path, clothing_path)
        result_image.save(output_path, 'JPEG', quality=95)
        
        # Convert result to base64 for frontend display
        with open(output_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Clean up uploaded files (optional)
        # os.remove(person_path)
        # os.remove(clothing_path)
        
        return jsonify({
            'success': True,
            'result_image': f"data:image/jpeg;base64,{encoded_image}",
            'output_filename': output_filename
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/outputs/<filename>')
def get_output_file(filename):
    return send_from_directory(app.config['OUTPUT_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
½U*cascade082-file:///c:/Users/getan/Documents/final/app.py