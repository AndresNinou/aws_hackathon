#!/usr/bin/env python3
"""
Simple demo webapp for testing HAR recording functionality.
This creates various types of network requests for comprehensive testing.
"""

from flask import Flask, render_template_string, jsonify, request, session
import time
import random
import json

app = Flask(__name__)
app.secret_key = 'demo-secret-key-for-testing'

# Sample data
PRODUCTS = [
    {"id": 1, "name": "Laptop", "price": 999.99, "category": "Electronics"},
    {"id": 2, "name": "Book", "price": 19.99, "category": "Education"},
    {"id": 3, "name": "Headphones", "price": 149.99, "category": "Electronics"},
    {"id": 4, "name": "Coffee", "price": 4.99, "category": "Food"},
]

USERS = [
    {"id": 1, "name": "Alice Johnson", "email": "alice@example.com"},
    {"id": 2, "name": "Bob Smith", "email": "bob@example.com"},
]

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Demo Webapp - HAR Recording Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 10px 15px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .result { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; min-height: 20px; }
        .loading { color: #666; font-style: italic; }
        .error { color: #dc3545; background: #f8d7da; border: 1px solid #f5c6cb; }
        .success { color: #155724; background: #d4edda; border: 1px solid #c3e6cb; }
        input, select { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Demo Webapp for HAR Recording Testing</h1>
        <p>This webapp generates various types of network requests perfect for testing HAR recording.</p>
        
        <div class="section">
            <h3>📦 API Requests</h3>
            <button onclick="fetchProducts()">Fetch Products (GET)</button>
            <button onclick="fetchUsers()">Fetch Users (GET)</button>
            <button onclick="createProduct()">Create Product (POST)</button>
            <button onclick="updateProduct()">Update Product (PUT)</button>
            <button onclick="deleteProduct()">Delete Product (DELETE)</button>
            <div id="api-result" class="result"></div>
        </div>
        
        <div class="section">
            <h3>🔐 Authentication</h3>
            <input type="text" id="username" placeholder="Username" value="testuser">
            <input type="password" id="password" placeholder="Password" value="testpass">
            <button onclick="login()">Login (POST with auth)</button>
            <button onclick="logout()">Logout</button>
            <div id="auth-result" class="result"></div>
        </div>
        
        <div class="section">
            <h3>📝 Forms & Data</h3>
            <input type="text" id="search-query" placeholder="Search products..." value="laptop">
            <button onclick="searchProducts()">Search (with params)</button>
            <select id="category-filter">
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Food">Food</option>
                <option value="Education">Education</option>
            </select>
            <button onclick="filterProducts()">Filter by Category</button>
            <div id="search-result" class="result"></div>
        </div>
        
        <div class="section">
            <h3>⚡ Dynamic Requests</h3>
            <button onclick="loadWithDelay()">Slow Request (3s delay)</button>
            <button onclick="triggerError()">Trigger Error (404)</button>
            <button onclick="uploadFile()">Simulate File Upload</button>
            <button onclick="realTimeUpdates()">Real-time Updates (WebSocket-like)</button>
            <div id="dynamic-result" class="result"></div>
        </div>
        
        <div class="section">
            <h3>🔄 Batch Operations</h3>
            <button onclick="performBatchRequests()">Multiple Sequential Requests</button>
            <button onclick="performParallelRequests()">Parallel Requests</button>
            <div id="batch-result" class="result"></div>
        </div>
        
        <div class="section">
            <h3>📊 Session & Cookies</h3>
            <button onclick="setSession()">Set Session Data</button>
            <button onclick="getSession()">Get Session Data</button>
            <button onclick="setCookies()">Set Cookies</button>
            <div id="session-result" class="result"></div>
        </div>
    </div>

    <script>
        function showLoading(elementId) {
            document.getElementById(elementId).innerHTML = '<div class="loading">Loading...</div>';
        }
        
        function showResult(elementId, data, isError = false) {
            const element = document.getElementById(elementId);
            element.innerHTML = `<pre class="${isError ? 'error' : 'success'}">${JSON.stringify(data, null, 2)}</pre>`;
        }
        
        async function fetchProducts() {
            showLoading('api-result');
            try {
                const response = await fetch('/api/products');
                const data = await response.json();
                showResult('api-result', data);
            } catch (error) {
                showResult('api-result', {error: error.message}, true);
            }
        }
        
        async function fetchUsers() {
            showLoading('api-result');
            try {
                const response = await fetch('/api/users');
                const data = await response.json();
                showResult('api-result', data);
            } catch (error) {
                showResult('api-result', {error: error.message}, true);
            }
        }
        
        async function createProduct() {
            showLoading('api-result');
            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name: 'New Product', price: 99.99, category: 'Test'})
                });
                const data = await response.json();
                showResult('api-result', data);
            } catch (error) {
                showResult('api-result', {error: error.message}, true);
            }
        }
        
        async function updateProduct() {
            showLoading('api-result');
            try {
                const response = await fetch('/api/products/1', {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name: 'Updated Laptop', price: 1199.99})
                });
                const data = await response.json();
                showResult('api-result', data);
            } catch (error) {
                showResult('api-result', {error: error.message}, true);
            }
        }
        
        async function deleteProduct() {
            showLoading('api-result');
            try {
                const response = await fetch('/api/products/2', {method: 'DELETE'});
                const data = await response.json();
                showResult('api-result', data);
            } catch (error) {
                showResult('api-result', {error: error.message}, true);
            }
        }
        
        async function login() {
            showLoading('auth-result');
            try {
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username, password})
                });
                const data = await response.json();
                showResult('auth-result', data);
            } catch (error) {
                showResult('auth-result', {error: error.message}, true);
            }
        }
        
        async function logout() {
            showLoading('auth-result');
            try {
                const response = await fetch('/auth/logout', {method: 'POST'});
                const data = await response.json();
                showResult('auth-result', data);
            } catch (error) {
                showResult('auth-result', {error: error.message}, true);
            }
        }
        
        async function searchProducts() {
            showLoading('search-result');
            try {
                const query = document.getElementById('search-query').value;
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                showResult('search-result', data);
            } catch (error) {
                showResult('search-result', {error: error.message}, true);
            }
        }
        
        async function filterProducts() {
            showLoading('search-result');
            try {
                const category = document.getElementById('category-filter').value;
                const response = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
                const data = await response.json();
                showResult('search-result', data);
            } catch (error) {
                showResult('search-result', {error: error.message}, true);
            }
        }
        
        async function loadWithDelay() {
            showLoading('dynamic-result');
            try {
                const response = await fetch('/api/slow');
                const data = await response.json();
                showResult('dynamic-result', data);
            } catch (error) {
                showResult('dynamic-result', {error: error.message}, true);
            }
        }
        
        async function triggerError() {
            showLoading('dynamic-result');
            try {
                const response = await fetch('/api/nonexistent');
                const data = await response.json();
                showResult('dynamic-result', data);
            } catch (error) {
                showResult('dynamic-result', {error: error.message}, true);
            }
        }
        
        async function uploadFile() {
            showLoading('dynamic-result');
            try {
                const formData = new FormData();
                formData.append('file', new Blob(['test content'], {type: 'text/plain'}), 'test.txt');
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                showResult('dynamic-result', data);
            } catch (error) {
                showResult('dynamic-result', {error: error.message}, true);
            }
        }
        
        async function realTimeUpdates() {
            showLoading('dynamic-result');
            try {
                // Simulate real-time updates with polling
                for (let i = 1; i <= 3; i++) {
                    const response = await fetch(`/api/realtime/${i}`);
                    const data = await response.json();
                    showResult('dynamic-result', {update: i, ...data});
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                showResult('dynamic-result', {error: error.message}, true);
            }
        }
        
        async function performBatchRequests() {
            showLoading('batch-result');
            try {
                const results = [];
                // Sequential requests
                for (let i = 1; i <= 3; i++) {
                    const response = await fetch(`/api/batch/${i}`);
                    const data = await response.json();
                    results.push(data);
                }
                showResult('batch-result', {sequential: results});
            } catch (error) {
                showResult('batch-result', {error: error.message}, true);
            }
        }
        
        async function performParallelRequests() {
            showLoading('batch-result');
            try {
                // Parallel requests
                const promises = [1, 2, 3].map(i => 
                    fetch(`/api/parallel/${i}`).then(r => r.json())
                );
                const results = await Promise.all(promises);
                showResult('batch-result', {parallel: results});
            } catch (error) {
                showResult('batch-result', {error: error.message}, true);
            }
        }
        
        async function setSession() {
            showLoading('session-result');
            try {
                const response = await fetch('/session/set', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({key: 'test_value', timestamp: Date.now()})
                });
                const data = await response.json();
                showResult('session-result', data);
            } catch (error) {
                showResult('session-result', {error: error.message}, true);
            }
        }
        
        async function getSession() {
            showLoading('session-result');
            try {
                const response = await fetch('/session/get');
                const data = await response.json();
                showResult('session-result', data);
            } catch (error) {
                showResult('session-result', {error: error.message}, true);
            }
        }
        
        async function setCookies() {
            showLoading('session-result');
            try {
                const response = await fetch('/cookies/set');
                const data = await response.json();
                showResult('session-result', data);
            } catch (error) {
                showResult('session-result', {error: error.message}, true);
            }
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

# API Endpoints
@app.route('/api/products')
def get_products():
    category = request.args.get('category')
    if category:
        filtered_products = [p for p in PRODUCTS if p['category'] == category]
        return jsonify({'products': filtered_products, 'filter': category})
    return jsonify({'products': PRODUCTS})

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.json
    new_product = {
        'id': len(PRODUCTS) + 1,
        'name': data.get('name', 'Unknown'),
        'price': data.get('price', 0.0),
        'category': data.get('category', 'General')
    }
    return jsonify({'created': new_product, 'status': 'success'})

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.json
    return jsonify({'updated': {'id': product_id, **data}, 'status': 'success'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    return jsonify({'deleted_id': product_id, 'status': 'success'})

@app.route('/api/users')
def get_users():
    return jsonify({'users': USERS})

@app.route('/api/search')
def search():
    query = request.args.get('q', '')
    results = [p for p in PRODUCTS if query.lower() in p['name'].lower()]
    return jsonify({'query': query, 'results': results, 'count': len(results)})

@app.route('/api/slow')
def slow_endpoint():
    time.sleep(3)  # Simulate slow request
    return jsonify({'message': 'This was a slow request', 'delay': '3 seconds'})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    files = request.files
    return jsonify({'uploaded_files': list(files.keys()), 'status': 'success'})

@app.route('/api/realtime/<int:update_id>')
def realtime_update(update_id):
    return jsonify({
        'timestamp': time.time(),
        'update_id': update_id,
        'data': f'Real-time update #{update_id}',
        'random_value': random.randint(1, 100)
    })

@app.route('/api/batch/<int:batch_id>')
def batch_request(batch_id):
    time.sleep(0.5)  # Small delay
    return jsonify({'batch_id': batch_id, 'processed_at': time.time()})

@app.route('/api/parallel/<int:request_id>')
def parallel_request(request_id):
    time.sleep(0.3)  # Small delay
    return jsonify({'request_id': request_id, 'processed_at': time.time()})

# Authentication endpoints
@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if username == 'testuser' and password == 'testpass':
        session['user'] = username
        session['login_time'] = time.time()
        return jsonify({'status': 'success', 'user': username, 'message': 'Logged in successfully'})
    else:
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

@app.route('/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'status': 'success', 'message': 'Logged out successfully'})

# Session endpoints
@app.route('/session/set', methods=['POST'])
def set_session():
    data = request.json
    for key, value in data.items():
        session[key] = value
    return jsonify({'status': 'success', 'set': data})

@app.route('/session/get')
def get_session():
    return jsonify({'session_data': dict(session)})

@app.route('/cookies/set')
def set_cookies():
    response = jsonify({'status': 'success', 'message': 'Cookies set'})
    response.set_cookie('demo_cookie', 'test_value', max_age=3600)
    response.set_cookie('user_pref', 'dark_mode', max_age=3600)
    return response

# Error endpoint
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found', 'status': 404}), 404

if __name__ == '__main__':
    print("🌐 Starting Demo Webapp for HAR Testing")
    print("=" * 50)
    print("URL: http://localhost:5000")
    print("This webapp generates various network requests for testing")
    print("Press Ctrl+C to stop")
    app.run(debug=True, port=5000)
