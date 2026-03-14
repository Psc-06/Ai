"""MongoDB connector for the BankShield backend."""

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "bankshield"

# Collection names used by the application.
SCAN_RESULTS_COLLECTION = "scan_results"
OWASP_FINDINGS_COLLECTION = "owasp_findings"
CVE_DATABASE_COLLECTION = "cve_database"


def _create_client() -> MongoClient:
    """Create a MongoDB client with a short server selection timeout."""
    return MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)


def get_database():
    """Return the BankShield database object.

    Raises:
        ConnectionFailure: If MongoDB is not reachable.
        PyMongoError: For other MongoDB-related failures.
    """
    try:
        client = _create_client()
        # Trigger server selection to fail fast if the server is unavailable.
        client.admin.command("ping")
        db = client[DB_NAME]

        # Touch collections so they are defined and available when accessed later.
        _ = db[SCAN_RESULTS_COLLECTION]
        _ = db[OWASP_FINDINGS_COLLECTION]
        _ = db[CVE_DATABASE_COLLECTION]

        return db
    except (ConnectionFailure, PyMongoError):
        raise


def test_connection() -> bool:
    """Test MongoDB connectivity and return True on success, False on failure."""
    try:
        client = _create_client()
        client.admin.command("ping")
        return True
    except (ConnectionFailure, PyMongoError):
        return False
