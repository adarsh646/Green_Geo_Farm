import io
import json
import os
import torch
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import transforms

# Import your model definition
from src.model import get_model

app = FastAPI(title="Cattle Breed Prediction API")

# Allow your MERN stack to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to your MERN domain (e.g. ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Load Class Names
CLASSES_FILE = "classes.json"
if not os.path.exists(CLASSES_FILE):
    raise RuntimeError(f"{CLASSES_FILE} not found! Please run extract_classes.py first.")

with open(CLASSES_FILE, "r") as f:
    CLASS_NAMES = json.load(f)

# 2. Setup Device & Load Model Weights
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
num_classes = len(CLASS_NAMES)

print(f"Loading model with {num_classes} classes on {device}...")
model = get_model(num_classes=num_classes, pretrained=False)

model_path = os.path.join("models", "best_model.pth")
if not os.path.exists(model_path):
    raise RuntimeError(f"Model weights not found at {model_path}! Train the model first.")

model.load_state_dict(torch.load(model_path, map_location=device))
model = model.to(device)
model.eval()

# 3. Define the same image transformations used during validation
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Provided file is not an image.")

    try:
        # Read the uploaded image bytes
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Preprocess the image
        input_tensor = transform(image)
        input_batch = input_tensor.unsqueeze(0).to(device)

        # Make prediction
        with torch.no_grad():
            output = model(input_batch)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            
            # Get the #1 prediction
            top_prob, top_catid = torch.max(probabilities, 0)
            
            # Get top 3 predictions
            top3_prob, top3_catid = torch.topk(probabilities, 3)
            top_3 = [
                {
                    "class": CLASS_NAMES[top3_catid[i].item()], 
                    "confidence": f"{float(top3_prob[i].item()) * 100:.2f}%"
                }
                for i in range(3)
            ]

        return {
            "prediction": CLASS_NAMES[top_catid.item()],
            "confidence": f"{float(top_prob.item()) * 100:.2f}%",
            "top_3": top_3
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# Health check endpoint
@app.get("/")
def health_check():
    return {"status": "healthy", "classes_loaded": len(CLASS_NAMES)}
