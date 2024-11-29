
function launchROS2Command(command) {
    fetch('/launch_ros_command', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('ROS2 command launched successfully');
        } else {
            console.error('Failed to launch ROS2 command');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}