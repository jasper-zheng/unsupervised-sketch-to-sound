import os
from sys import stdout
import logging

from flask import Flask, render_template
from flask_socketio import SocketIO, emit


from processor import Processor
from model import Pipeline

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

async_mode = None
app = Flask(__name__)
app.logger.addHandler(logging.StreamHandler(stdout))
app.config['SECRET_KEY'] = os.urandom(24).hex()
app.config['DEBUG'] = True
socketio = SocketIO(app)

quality = 0.75

processor = Processor(Pipeline(has_model=False), quality = quality)

@app.route('/')
def index():
    """Video streaming home page."""
    return render_template('index.html')


@socketio.on('input_frame', namespace='/demo')
def process_frame(input):
    input = input.split(",")[1]
    processor.enqueue_input(input)
    # out_data = str(processor.get_frame(), "utf-8")
    out_data = processor.get_frame()
    emit('processed_frame', {'latent_code': out_data}, namespace='/demo')

@socketio.on('recording', namespace='/demo')
def recording(is_recording):
    processor.send_osc()

@socketio.on('connect', namespace='/demo')
def test_connection():
    # emit('set_layer_names', {'names': layer_names}, namespace='/demo')
    print("client connected")
    app.logger.info("client connected")

def handler(signal_received, frame):
    # Handle any cleanup here
    print('SIGINT or CTRL-C detected. Exiting gracefully')
    exit(0)

if __name__ == '__main__':

    socketio.run(app,port=5005)