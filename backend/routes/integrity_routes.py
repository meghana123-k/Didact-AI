from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db
import logging

integrity_bp = Blueprint('integrity', __name__)

@integrity_bp.route('/log', methods=['POST'])
@jwt_required()
def log_event():
    user_id = get_jwt_identity()
    data = request.get_json()
    event_type = data.get('event')
    timestamp = data.get('timestamp')
    
    # In a production app, we would save this to a dedicated IntegrityEvent table.
    # For now, we log it and ensure the API response is correct for the frontend.
    logging.info(f"Integrity Event: User {user_id} - {event_type} at {timestamp}")
    
    return jsonify({"status": "logged", "user_id": user_id, "event": event_type}), 200
