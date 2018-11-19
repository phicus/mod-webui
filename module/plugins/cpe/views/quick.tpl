%import json
%helper = app.helper

{{ json.dumps(helper.get_host_service_aggregation_tree(host, app)) }}
