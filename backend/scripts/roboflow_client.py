import os
from typing import Any, Dict

try:
    from inference_sdk import InferenceHTTPClient
except Exception:  # pragma: no cover - user will install when needed
    InferenceHTTPClient = None


def get_client(api_key: str | None = None):
    """Return an InferenceHTTPClient configured with the provided API key.

    The API key is read from the `ROBOFLOW_API_KEY` environment variable if
    not provided.
    """
    key = api_key or os.environ.get('ROBOFLOW_API_KEY') or os.environ.get('RF_API_KEY')
    if key is None:
        raise RuntimeError('Roboflow API key not set. Export ROBOFLOW_API_KEY.')
    if InferenceHTTPClient is None:
        raise RuntimeError('inference_sdk not installed. Run `pip install inference-sdk`')
    return InferenceHTTPClient(api_url='https://serverless.roboflow.com', api_key=key)


def run_workflow(image_path: str, workspace_name: str, workflow_id: str, parameters: Dict[str, Any] | None = None, use_cache: bool = True):
    """Run a Roboflow workflow on a local image and return the raw result."""
    client = get_client()
    images = {"image": image_path}
    params = parameters or {}
    return client.run_workflow(workspace_name=workspace_name, workflow_id=workflow_id, images=images, parameters=params, use_cache=use_cache)
