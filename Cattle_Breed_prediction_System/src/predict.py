import os
import torch
from torchvision import transforms
from PIL import Image
import json
from model import get_model

def load_class_names(data_dir):
    """
    Helper function to load class names from the dataset directory structure.
    """
    from torchvision import datasets
    if os.path.exists(data_dir):
        # ImageFolder automatically alphabetically sorts the folders to assign class indices
        dataset = datasets.ImageFolder(data_dir)
        return dataset.classes
    return []

def predict_image(image_path, model_path, class_names):
    """
    Predicts the cattle breed for a given image.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Load model
    num_classes = len(class_names)
    model = get_model(num_classes=num_classes, pretrained=False)
    
    if not os.path.exists(model_path):
        print(f"Error: Model weights not found at {model_path}. Please train the model first.")
        return None
        
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    
    # Define transforms (must match validation transforms in dataset.py)
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Load and preprocess image
    try:
        image = Image.open(image_path).convert('RGB')
        input_tensor = transform(image)
        input_batch = input_tensor.unsqueeze(0) # create a mini-batch as expected by the model
        input_batch = input_batch.to(device)
    except Exception as e:
        print(f"Error loading image {image_path}: {e}")
        return None
        
    # Predict
    with torch.no_grad():
        output = model(input_batch)
        
        # Apply softmax to get probabilities
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        
        # Get top prediction
        top_prob, top_catid = torch.max(probabilities, 0)
        
        prediction = {
            "class": class_names[top_catid.item()],
            "confidence": f"{top_prob.item() * 100:.2f}%"
        }
        
        # Optional: Get top 3 predictions
        top3_prob, top3_catid = torch.topk(probabilities, 3)
        prediction["top_3"] = [
            {"class": class_names[top3_catid[i].item()], "confidence": f"{top3_prob[i].item() * 100:.2f}%"}
            for i in range(3)
        ]
        
    return prediction

if __name__ == '__main__':
    # Define paths
    base_dir = os.path.join(os.path.dirname(__file__), '..')
    dataset_dir = os.path.join(base_dir, 'data_sets')
    model_weights_path = os.path.join(base_dir, 'models', 'best_model.pth')
    
    class_names = load_class_names(dataset_dir)
    
    if not class_names:
        print(f"Error: Could not load class names from {dataset_dir}")
    else:
        # Ask user for an image path to test
        import sys
        if len(sys.argv) > 1:
            test_image_path = sys.argv[1]
        else:
            print("Please provide an image path as an argument. Example:")
            print("python predict.py path/to/cow_image.jpg")
            sys.exit(1)
            
        print(f"Predicting breed for: {test_image_path}")
        result = predict_image(test_image_path, model_weights_path, class_names)
        
        if result:
            print("\n--- Prediction Results ---")
            print(f"Top Breed: {result['class']} (Confidence: {result['confidence']})")
            print("\nTop 3 Possibilities:")
            for item in result['top_3']:
                print(f" - {item['class']}: {item['confidence']}")
