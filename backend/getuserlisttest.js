// 使用fetch API
async function getUserList() {
    const token = 'your_jwt_token';
    const response = await fetch('http://localhost:8000/api/users/list?current=1&size=20', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    return data;
}

// 使用axios
import axios from 'axios';

async function getUserList() {
    const token = 'your_jwt_token';
    const response = await axios.get('http://localhost:8000/api/users/list', {
        params: { current: 1, size: 20 },
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
}