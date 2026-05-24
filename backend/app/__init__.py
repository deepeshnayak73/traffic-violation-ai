from flask import Flask
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

mongo = PyMongo()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Config
    app.config["MONGO_URI"] = os.getenv("MONGO_URI")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    
    # Extensions
    mongo.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=os.getenv("CORS_ORIGINS"))
    
    # Routes
    from app.routes.auth import auth_bp
    from app.routes.violations import violations_bp
    from app.routes.stream import stream_bp
    
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(violations_bp, url_prefix="/api/violations")
    app.register_blueprint(stream_bp, url_prefix="/api")
    
    return app