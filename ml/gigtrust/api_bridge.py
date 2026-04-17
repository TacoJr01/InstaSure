import sys
import json
from predict import predict_gts

data = json.loads(sys.argv[1])

result = predict_gts(data)

print(json.dumps(result))