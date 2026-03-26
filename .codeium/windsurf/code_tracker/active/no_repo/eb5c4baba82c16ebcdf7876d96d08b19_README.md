�$# Virtual Try-On System

A working virtual try-on system that digitally dresses a person in clothing items while preserving identity and appearance.

## Features

- **Real Virtual Try-On**: Not image generation, but actual clothing fitting simulation
- **Identity Preservation**: Maintains person's face, hair, skin tone, body shape, and pose
- **Realistic Results**: Proper garment alignment, natural fabric folds, and clean edges
- **Web Interface**: Simple drag-and-drop interface for uploading images
- **Local Processing**: Runs entirely locally without paid APIs

## Tech Stack

### Backend
- **Python** with Flask
- **OpenCV** for image processing
- **PIL/Pillow** for image manipulation
- **NumPy** for numerical operations
- **PyTorch** for tensor operations (optional for future enhancements)

### Frontend
- **HTML5/CSS3** with modern styling
- **JavaScript** for file handling and API communication
- **Responsive design** for mobile compatibility

## Installation

1. Clone or download this project
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask application:
   ```bash
   python app.py
   ```

4. Open your browser and go to `http://localhost:5000`

## How It Works

### 1. Image Upload
- Upload a person photo (standing upright, facing camera)
- Upload a clothing item photo

### 2. Processing Pipeline
- **Body Detection**: Identifies key body regions (face, shoulders, chest, waist)
- **Clothing Extraction**: Isolates the clothing item from its background
- **Geometric Warping**: Aligns clothing to body proportions
- **Realistic Blending**: Combines clothing with person while preserving identity

### 3. Result
- Returns a photorealistic image of the person wearing the clothing
- Maintains original lighting and shadows
- Preserves person's identity and pose

## Project Structure

```
virtual-try-on/
├── app.py                 # Flask backend with virtual try-on pipeline
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Frontend web interface
├── uploads/               # Temporary upload directory
├── outputs/              # Generated results directory
└── README.md             # This file
```

## API Endpoints

- `GET /` - Main web interface
- `POST /try_on` - Process virtual try-on
  - Parameters: `person_image`, `clothing_image` (multipart/form-data)
  - Returns: JSON with result image in base64 format
- `GET /outputs/<filename>` - Access generated result images

## Usage Guidelines

### Person Image Requirements
- Standing upright, facing the camera
- Clear visibility of upper body
- Good lighting conditions
- High resolution recommended

### Clothing Image Requirements
- Clothing item photographed alone
- Clean background (preferably white/neutral)
- Full garment visible
- Good contrast and clarity

## Technical Details

### Body Keypoint Detection
Uses OpenCV's face detection as a proxy for body positioning, estimating:
- Face position for identity preservation
- Shoulder alignment for garment fitting
- Chest and waist regions for proper clothing placement

### Clothing Warping Algorithm
- Perspective transformation based on body proportions
- Maintains garment structure and texture
- Adapts to different body shapes naturally

### Blending Process
- Region-aware masking for upper body only
- Preserves face, hair, and hands
- Adds realistic shadows and lighting effects
- Maintains original image quality

## Limitations

- Works best with front-facing person photos
- Optimal for upper body clothing (shirts, tops, jackets)
- Quality depends on input image conditions
- Currently uses simplified body detection (can be enhanced with pose estimation models)

## Future Enhancements

- Integration with advanced pose estimation models (OpenPose, MediaPipe)
- Support for full-body clothing (pants, dresses)
- Real-time processing capabilities
- Advanced fabric simulation
- Multiple clothing items combination

## Troubleshooting

### Common Issues

1. **Poor Results**: Ensure good lighting and clear images
2. **Processing Errors**: Check image formats (JPG/PNG supported)
3. **Slow Performance**: System uses CPU; GPU acceleration can be added

### Error Messages
- "Both person and clothing images are required": Upload both images
- "No selected files": Choose image files before processing
- Network errors: Check if Flask server is running

## License

This project is for educational and demonstration purposes.
�$*cascade0820file:///c:/Users/getan/Documents/final/README.md