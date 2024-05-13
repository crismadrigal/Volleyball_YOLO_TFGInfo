''' Dec: This script is used to predict objects in an image/video using a YOLO model.'''
# python3 detections.py --detect --model --file --confidence 

from ultralytics import YOLO
import argparse

def predict(detect, model, file, confidence):
    """
    Predicts in the image/video using the specified model
    :param model: The model to use for prediction
    :param file: The image/video file to predict
    :param confidence: The confidence threshold
    :return: The prediction
    """
    # Load the specified pretrained model 
    if(model==1):
        if detect == "ball":
            model = YOLO('../weights/ball.pt')
        elif detect == "players":
            model = YOLO('../weights/players.pt')
        elif detect == "actions":
            model = YOLO('../weights/best_actions.pt')
        elif detect == "court":
            model = YOLO('../weights/best_court.pt')
        elif detect == "net":
            model = YOLO('../weights/net_grande.pt')
        elif detect == "referees":
            model = YOLO('../weights/best_referees.pt')
        else:
            return "Invalid detection type. Please try again."
        return model.predict(source=file, conf=confidence, save=True)
    # Load the specified pretrained model from Ultralytics YOLO 
    elif model==2 and detect == "players":
        model = YOLO('yolov8n.pt') 
        return model.predict(source=file, conf=confidence, classes=[0], save=True)  
    elif model==3 and detect == "players":
        model = YOLO('yolov9e.pt')
        # id 0: person
        return model.predict(source=file, conf=confidence, classes=[0], save=True) 
    elif model==2 and detect == "ball":
        model = YOLO('yolov8n.pt')    
        # id 32: sports ball
        return model.predict(source=file, conf=confidence, classes=[32], save=True) 
    elif model==3 and detect == "ball":
        model = YOLO('yolov9e.pt')
        # id 32: sports ball
        return model.predict(source=file, conf=confidence, classes=[32], save=True)
    return "Invalid model type. Please try again."

def main():
    '''Parse the arguments and call the predict function.'''
    parser = argparse.ArgumentParser(description="Predict objects in an image/video using a YOLO model.")
    parser.add_argument('--detect', type=str, choices=['ball', 'actions', 'court', 'net', 'referees', 'players'], help='Type of detection to perform', required=True)
    parser.add_argument('--model', type=int, help='Model type (currently unused, placeholder for future functionality)', required=True)
    parser.add_argument('--file', type=str, help='File path of the image/video to predict', required=True)
    parser.add_argument('--confidence', type=float, help='Confidence threshold for predictions', required=True)
    
    args = parser.parse_args()

    result = predict(args.detect, args.model, args.file, args.confidence)

    print(result)

if __name__ == "__main__":
    main()
