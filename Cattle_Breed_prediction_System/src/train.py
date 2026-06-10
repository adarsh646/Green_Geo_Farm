import os
import torch
import torch.nn as nn
import torch.optim as optim
from dataset import get_dataloaders
from model import get_model

def train_model(data_dir, num_epochs=10, batch_size=32, learning_rate=0.001):
    # Setup device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)

    # Load Data
    print("Loading datasets...")
    train_loader, val_loader, class_names = get_dataloaders(data_dir, batch_size=batch_size)
    num_classes = len(class_names)
    print(f"Found {num_classes} classes.")

    # Initialize Model, Loss, and Optimizer
    print("Initializing model...")
    model = get_model(num_classes=num_classes).to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    
    # Optional: Learning rate scheduler
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.1)

    best_val_acc = 0.0

    print("Starting training...")
    for epoch in range(num_epochs):
        print(f"\nEpoch {epoch+1}/{num_epochs}")
        print("-" * 10)

        # Each epoch has a training and validation phase
        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()  # Set model to training mode
                dataloader = train_loader
            else:
                model.eval()   # Set model to evaluate mode
                dataloader = val_loader

            running_loss = 0.0
            running_corrects = 0

            # Iterate over data.
            for inputs, labels in dataloader:
                inputs = inputs.to(device)
                labels = labels.to(device)

                # Zero the parameter gradients
                optimizer.zero_grad()

                # Forward
                # Track history if only in train
                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    # Backward + optimize only if in training phase
                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                # Statistics
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            if phase == 'train':
                scheduler.step()

            epoch_loss = running_loss / len(dataloader.dataset)
            epoch_acc = running_corrects.double() / len(dataloader.dataset)

            print(f"{phase.capitalize()} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

            # Deep copy the model if it's the best one
            if phase == 'val' and epoch_acc > best_val_acc:
                best_val_acc = epoch_acc
                torch.save(model.state_dict(), 'models/best_model.pth')
                print(f"--> Saved new best model with accuracy: {best_val_acc:.4f}")

    print(f"\nTraining complete. Best Validation Accuracy: {best_val_acc:.4f}")

if __name__ == '__main__':
    # Assuming dataset is in the parent directory
    dataset_directory = os.path.join(os.path.dirname(__file__), '..', 'data_sets')
    
    if not os.path.exists(dataset_directory):
        print(f"Error: Dataset directory not found at {dataset_directory}")
    else:
        # Note: You might want to adjust batch_size based on your GPU memory
        train_model(dataset_directory, num_epochs=10, batch_size=16, learning_rate=0.001)
