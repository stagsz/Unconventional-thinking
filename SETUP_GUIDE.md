# MCP Security Scanner - Quick Setup Guide

## 🚀 Getting Started

You now have a complete MCP Security SaaS platform saved in your `Unreasonable-thinking-server` folder!

## 📁 Files Added

- **`index.html`** - Professional SaaS frontend with API integration
- **`API_DOCUMENTATION.md`** - Complete API reference documentation

## 🛠️ How to Run

### 1. Start the Backend API Server

```bash
# Navigate to your MCP security folder
cd "C:\Users\staff\anthropicFun\mcp-security-saas"

# Install dependencies (if not already done)
pip install fastapi uvicorn sqlite3 smtplib

# Start the server
python start_server.py
```

The API server will start at `http://localhost:8000`

### 2. Open the Frontend

```bash
# Navigate to your project folder
cd "C:\Users\staff\anthropicFun\Unreasonable-thinking-server"

# Open the frontend in your browser
start index.html
# OR double-click index.html in Windows Explorer
```

## ✅ What You Can Do Now

### 1. **Real Security Scanning**
- Paste MCP server code or tool definitions
- Get detailed vulnerability reports
- Receive security scores (0-100)
- See specific recommendations

### 2. **Live Dashboard**
- Real-time API connection status
- Security statistics from your database
- Recent alerts with acknowledge/resolve actions

### 3. **API Documentation**
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **Complete Guide**: ./API_DOCUMENTATION.md
- **Vulnerability Database**: http://localhost:8000/api/vulnerability-database

### 4. **Professional Alerts**
Configure email notifications:

```bash
curl -X POST http://localhost:8000/api/configure/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "email": {
      "smtp_server": "smtp.gmail.com",
      "username": "your_email@gmail.com",
      "password": "your_app_password",
      "to_emails": ["security@yourcompany.com"]
    }
  }'
```

## 🧪 Test with Example Vulnerabilities

### Vulnerable Tool (Will trigger multiple alerts):
```json
{
  "name": "file_reader",
  "description": "Read files from the system",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filepath": {
        "type": "string",
        "description": "Path to the file"
      }
    },
    "required": ["filepath"]
  }
}
```

### Secure Tool (Clean scan):
```json
{
  "name": "secure_calculator",
  "description": "Perform basic math calculations",
  "inputSchema": {
    "type": "object",
    "properties": {
      "operation": {
        "type": "string",
        "enum": ["add", "subtract", "multiply", "divide"],
        "description": "Math operation to perform"
      },
      "num1": {
        "type": "number",
        "minimum": -1000000,
        "maximum": 1000000,
        "description": "First number"
      },
      "num2": {
        "type": "number",
        "minimum": -1000000,
        "maximum": 1000000,
        "description": "Second number"
      }
    },
    "required": ["operation", "num1", "num2"]
  }
}
```

## 💼 Business Ready Features

Your platform now supports:

### **$500 Basic Scans**
- Automated vulnerability detection
- Professional security reports
- Security scoring and risk assessment

### **$2000 Comprehensive Audits**
- Multiple server scanning
- Alert management system
- Detailed compliance reporting

### **$99-999/month SaaS Platform**
- Real-time monitoring dashboard
- Automated alerting system
- Professional client interface

## 🎯 Next Steps for Business Launch

1. **Customize Branding**:
   - Update colors and logos in `index.html`
   - Add your company information

2. **Configure Email Alerts**:
   - Set up SMTP server for notifications
   - Test alert delivery

3. **Create Demo Materials**:
   - Record screen demonstrations
   - Prepare customer presentations

4. **Start Customer Outreach**:
   - Use the professional interface for demos
   - Show real vulnerability detection

## 🔧 Troubleshooting

### API Not Connecting?
- Ensure the backend server is running: `python start_server.py`
- Check that port 8000 is available
- Verify no firewall blocking localhost:8000

### No Vulnerabilities Found?
- Try the example vulnerable tool above
- Check that the tool definition is valid JSON
- Review the API logs for any errors

### Alerts Not Working?
- Configure email settings via API
- Check SMTP credentials
- Verify email server connectivity

## 📞 Support

If you need help:
1. Check the API documentation: `./API_DOCUMENTATION.md`
2. View Swagger UI: http://localhost:8000/api/docs
3. Review the backend logs for any errors

---

**🎉 Congratulations! You now have a professional MCP Security SaaS platform ready for business!**