import os
import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split

# Moved TransformSubset outside the function so it can be pickled by Windows multiprocessing
class TransformSubset(torch.utils.data.Dataset):
    def __init__(self, subset, transform=None):
        self.subset = subset
        self.transform = transform

    def __getitem__(self, index):
        x, y = self.subset[index]
        if self.transform:
            x = self.transform(x)
        return x, y

    def __len__(self):
        return len(self.subset)

def get_dataloaders(data_dir, batch_size=32, num_workers=0, test_split=0.2):
    """
    Creates PyTorch DataLoaders for the dataset.
    
    Args:
        data_dir (str): Path to the root directory containing the dataset folders.
        batch_size (int): Number of images per batch.
        num_workers (int): Number of subprocesses to use for data loading (0 on Windows CPU is safest).
        test_split (float): Fraction of the dataset to reserve for validation/testing.
        
    Returns:
        train_loader (DataLoader): DataLoader for the training set.
        val_loader (DataLoader): DataLoader for the validation set.
        class_names (list): List of class names (cattle breeds).
    """
    # Define data transformations (augmentations for training, standardizing for validation)
    train_transforms = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        # Normalize using ImageNet mean and std as we will use a pre-trained model
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transforms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Load the entire dataset using ImageFolder
    full_dataset = datasets.ImageFolder(data_dir)
    class_names = full_dataset.classes

    # Calculate lengths for splitting
    val_size = int(len(full_dataset) * test_split)
    train_size = len(full_dataset) - val_size

    # Split the dataset randomly
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    # Apply specific transforms to the splits using our global class
    train_dataset = TransformSubset(train_dataset, transform=train_transforms)
    val_dataset = TransformSubset(val_dataset, transform=val_transforms)

    # Create DataLoaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    return train_loader, val_loader, class_names

if __name__ == '__main__':
    data_directory = os.path.join(os.path.dirname(__file__), '..', 'data_sets')
    
    if os.path.exists(data_directory):
        print(f"Loading data from {data_directory}...")
        train_loader, val_loader, class_names = get_dataloaders(data_directory, batch_size=4)
        
        print(f"Found {len(class_names)} classes.")
        print(f"Number of training batches: {len(train_loader)}")
        print(f"Number of validation batches: {len(val_loader)}")
        
        for images, labels in train_loader:
            print(f"Batch image shape: {images.shape}")
            print(f"Batch labels: {labels}")
            break
    else:
        print(f"Error: Dataset directory not found at {data_directory}")
