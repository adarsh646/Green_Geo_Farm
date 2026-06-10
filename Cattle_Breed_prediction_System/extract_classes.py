import os
import json
from torchvision import datasets

def extract():
    # Assuming this script is run from the project root
    data_dir = "data_sets"
    
    if not os.path.exists(data_dir):
        print(f"Error: Could not find '{data_dir}' directory. Make sure you are running this from the project root.")
        return
    
    print("Reading folders to extract class names...")
    dataset = datasets.ImageFolder(data_dir)
    classes = dataset.classes
    
    output_file = "classes.json"
    with open(output_file, "w") as f:
        json.dump(classes, f, indent=4)
        
    print(f"Successfully extracted {len(classes)} classes into {output_file}")

if __name__ == "__main__":
    extract()
