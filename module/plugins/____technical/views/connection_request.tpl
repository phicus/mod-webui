<pre>
%for connection in connections:
%if connection:
  /usr/bin/wget --quiet --output-document=/dev/null --http-user=cpeusername --http-password=VeryS3cr3t {{connection}}; sleep 1;
%end
%end
<pre>
