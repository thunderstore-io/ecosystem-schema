import os
import util
import requests

# Submit the ecosystem schema file to the API.
def deploy(file):
    if not os.path.isfile(file):
        raise Exception(f"The file {file} does not exist")

    api_key = util.get_env_var("DEPLOY_API_KEY")
    api_url = util.get_env_var("DEPLOY_API_URL")

    body = open(file).read()
    headers = {
        "Authorization": api_key
    }

    response = requests.post(api_url, body, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Request returned a non-200 status code: {response.status_code}")
