# app.py
from flask import Flask, render_template, jsonify, request
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
import threading
import json

app = Flask(__name__)

# Global variable to store latest twist message 
latest_twist = {
    'linear': {'x': 0.0, 'y': 0.0, 'z': 0.0},
    'angular': {'x': 0.0, 'y': 0.0, 'z': 0.0}
}

# Constants for velocity (same as turtlebot3_teleop)
LINEAR_VEL_STEP_SIZE = 0.01
ANGULAR_VEL_STEP_SIZE = 0.1
MAX_LINEAR_VEL = 0.22
MAX_ANGULAR_VEL = 2.84

class ROSNode(Node):
    def __init__(self):
        super().__init__('web_interface_node')
        # Publisher for cmd_vel
        self.publisher = self.create_publisher(Twist, '/cmd_vel', 10)
        # Subscriber to monitor cmd_vel
        self.subscription = self.create_subscription(
            Twist,
            '/cmd_vel',
            self.cmd_vel_callback,
            10)
        
    def cmd_vel_callback(self, msg):
        global latest_twist
        latest_twist = {
            'linear': {
                'x': msg.linear.x,
                'y': msg.linear.y,
                'z': msg.linear.z
            },
            'angular': {
                'x': msg.angular.x,
                'y': msg.angular.y,
                'z': msg.angular.z
            }
        }
    
    def publish_velocity(self, linear_x, angular_z):
        msg = Twist()
        # Ensure we don't exceed max velocities
        msg.linear.x = max(min(linear_x, MAX_LINEAR_VEL), -MAX_LINEAR_VEL)
        msg.angular.z = max(min(angular_z, MAX_ANGULAR_VEL), -MAX_ANGULAR_VEL)
        self.publisher.publish(msg)

# Initialize ROS2 node
ros_node = None

def init_ros():
    global ros_node
    rclpy.init()
    ros_node = ROSNode()
    
    # Spin ROS2 node in a separate thread
    def spin_ros():
        rclpy.spin(ros_node)
    
    thread = threading.Thread(target=spin_ros, daemon=True)
    thread.start()

# Initialize ROS2
init_ros()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/twist')
def get_twist():
    return jsonify(latest_twist)

@app.route('/cmd_vel', methods=['POST'])
def send_cmd_vel():
    data = request.get_json()
    linear_x = float(data.get('linear_x', 0.0))
    angular_z = float(data.get('angular_z', 0.0))
    ros_node.publish_velocity(linear_x, angular_z)
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)