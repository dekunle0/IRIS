import sys
import hashlib
import os

def sign_models(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.onnx'):
                path = os.path.join(root, file)
                with open(path, 'rb') as f:
                    data = f.read()
                signature = hashlib.sha256(data).hexdigest()
                with open(f"{path}.sig", 'w') as f:
                    f.write(signature)
                print(f"Signed {path}")

if __name__ == '__main__':
    sign_models(sys.argv[1] if len(sys.argv) > 1 else 'packages/ai/models')

