from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import network

app = Flask(__name__)
CORS(app)

net = None
net_trained = False


@app.route("/api/train", methods=["GET"])
def train():
    global net
    global net_trained
    # Load the MNIST dataset
    mnist = tf.keras.datasets.mnist

    # Split the data into training and testing sets
    (x_train, y_train), (x_test, y_test) = mnist.load_data()

    x_train_flat = []
    x_test_flat = []

    for item in x_train:
        train_item = np.array([item]).flatten()
        train_item = np.array([[item / 255.0] for item in train_item])
        x_train_flat.append(train_item)

    for item in x_test:
        test_item = np.array([item]).flatten()
        test_item = np.array([[item / 255.0] for item in test_item])
        x_test_flat.append(test_item)

    y_train_vec = []
    for item in y_train:
        y_train_vec.append(np.array([[int(i == item)] for i in range(10)]))

    training_data = list(zip(x_train_flat, y_train_vec))
    test_data = list(zip(x_test_flat, y_test))

    net = network.Network([784, 100, 10])
    epochs = 30
    batch_size = 10
    learning_rate = 3.0
    net.SGD(training_data, epochs, batch_size,
            learning_rate, test_data=test_data)
    net_trained = True
    return jsonify({"status": "training complete."}), 200


@app.route('/api/digit', methods=['POST'])
def digit():
    global net
    global net_trained
    if not request.json or 'bitmap' not in request.json:
        return jsonify({'error': 'Bad Request'}), 400
    if net_trained == False:
        return jsonify({'error': 'You must first train the neural net.'}), 400
    bitmap = request.json['bitmap']
    # Must normalise.
    bitmap_norm = np.array([np.array([item / 255]) for item in bitmap])
    res = net.feedforward(bitmap_norm)
    print(np.argmax(res), "test")
    return jsonify({'result': res.tolist()}), 201


if __name__ == '__main__':
    app.run(debug=True)
