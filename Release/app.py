# app.py
from flask import Flask, render_template, jsonify, request
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist, PoseWithCovariance  # Updated import
import threading
import json
import subprocess

# =============================================
# Variables and Constants
# =============================================

app = Flask(__name__)

# Global variable to store latest twist message 
latest_cmd_vel = {
    'linear': {'x': 0.0, 'y': 0.0, 'z': 0.0},
    'angular': {'x': 0.0, 'y': 0.0, 'z': 0.0}
}

# Update global pose variable with covariance
latest_pose = {
    'pose': {
        'position': {'x': 0.0, 'y': 0.0, 'z': 0.0},
        'orientation': {'x': 0.0, 'y': 0.0, 'z': 0.0, 'w': 0.0}
    },
    'covariance': [0.0] * 36
}

# Constants for velocity
LINEAR_VEL_STEP_SIZE = 0.01
ANGULAR_VEL_STEP_SIZE = 0.1
MAX_LINEAR_VEL = 0.22
MAX_ANGULAR_VEL = 2.84

# =============================================
# ROS2 Node class implementation
# =============================================

class ROSNode(Node):
    def __init__(self):
        super().__init__('web_interface_node')

        # Publisher to publish cmd_vel
        self.publisher = self.create_publisher(Twist, '/cmd_vel', 10)
        # Subscriber to monitor cmd_vel
        self.subscription = self.create_subscription(
            Twist,
            '/cmd_vel',
            self.cmd_vel_callback,
            10)
        
        # Subscriber to monitor pose
        self.pose_subscription = self.create_subscription(
            PoseWithCovariance,
            '/pose_odom',  # Updated topic name
            self.pose_callback,
            10)
        
    # Callback function to update latest_cmd_vel
    def cmd_vel_callback(self, msg):
        global latest_cmd_vel
        latest_cmd_vel = {
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
    
    # Callback function to update latest_pose
    def pose_callback(self, msg):
        global latest_pose
        latest_pose = {
            'position': {
                'x': msg.pose.position.x,
                'y': msg.pose.position.y
            }
        }
    
    # Function to publish velocity
    def publish_velocity(self, linear_x, angular_z):
        msg = Twist()
        # Ensure we don't exceed max velocities
        msg.linear.x = max(min(linear_x, MAX_LINEAR_VEL), -MAX_LINEAR_VEL)
        msg.angular.z = max(min(angular_z, MAX_ANGULAR_VEL), -MAX_ANGULAR_VEL)
        self.publisher.publish(msg)

# =============================================
# Initialize ROS2 node
# =============================================

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

init_ros()

# =============================================
# Flask routes API implementation
# =============================================

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_cmd_vel')
def get_twist():
    return jsonify(latest_cmd_vel)

@app.route('/pose')
def get_pose():
    return jsonify(latest_pose)

@app.route('/set_cmd_vel', methods=['POST'])
def send_cmd_vel():
    data = request.get_json()
    linear_x = float(data.get('linear_x', 0.0))
    angular_z = float(data.get('angular_z', 0.0))
    ros_node.publish_velocity(linear_x, angular_z)
    return jsonify({"status": "success"})

@app.route('/launch_ros_command', methods=['POST'])
def launch_ros_command():
    data = request.get_json()
    command = data.get('command')
    try:
        # Source the ROS2 setup script and then run the command
        full_command = f"source ~/ros2_ws/install/setup.bash && {command}"
        subprocess.Popen(full_command, shell=True, executable='/bin/bash')
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/kill_mapping_scripts', methods=['POST'])
def kill_mapping_scripts():
    try:
        # Kill both scripts using pkill
        subprocess.run(['pkill', '-f', 'rpm_processor.py'])
        subprocess.run(['pkill', '-f', 'odometry.py'])
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# =============================================
# Main function to run the Flask app
# =============================================

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1880)