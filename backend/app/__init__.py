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
    
    # MongoDB SSL Fix
    mongo_uri = os.getenv("MONGO_URI", "")
    if "mongodb+srv" in mongo_uri and "tlsAllowInvalidCertificates" not in mongo_uri:
        mongo_uri += "&tlsAllowInvalidCertificates=true"
    
    app.config["MONGO_URI"] = mongo_uri
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_REFRESH_SECRET_KEY"] = os.getenv(
        "JWT_REFRESH_SECRET", os.getenv("JWT_SECRET_KEY")
    )
    
    # Extensions
    mongo.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Routes
    from app.routes.auth import auth_bp
    from app.routes.violations import violations_bp
    from app.routes.stream import stream_bp
    from app.routes.analytics import analytics_bp
    from app.routes.cameras import cameras_bp
    from app.routes.users import users_bp
    
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(violations_bp, url_prefix="/api/violations")
    app.register_blueprint(stream_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(cameras_bp, url_prefix="/api/cameras")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    
    return app


app = create_app()