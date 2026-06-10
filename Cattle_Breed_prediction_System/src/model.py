import torch
import torch.nn as nn
from torchvision import models

def get_model(num_classes=50, pretrained=True):
    """
    Creates a pre-trained ResNet-18 model modified for the specific number of classes.
    
    Args:
        num_classes (int): Number of target classes (cattle breeds).
        pretrained (bool): Whether to use ImageNet pre-trained weights.
        
    Returns:
        model (nn.Module): The PyTorch model.
    """
    # Load the pre-trained ResNet-18 model
    weights = models.ResNet18_Weights.DEFAULT if pretrained else None
    model = models.resnet18(weights=weights)
    
    # Freeze the base layers if we only want to train the final classifier
    # Un-comment the next two lines if you want to freeze the base layers initially
    # for param in model.parameters():
    #     param.requires_grad = False
        
    # Replace the final fully connected layer
    # The original ResNet-18 fc layer has 1000 output features (ImageNet classes)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    
    return model

if __name__ == '__main__':
    # Simple test to verify the model instantiation
    print("Testing model creation...")
    model = get_model(num_classes=50)
    print(model)
    
    # Test a dummy input
    dummy_input = torch.randn(1, 3, 224, 224)
    output = model(dummy_input)
    print(f"Output shape: {output.shape} (Expected: 1, 50)")
