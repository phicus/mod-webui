%rebase("layout", breadcrumb=[ ['System parameters', '/system-parameters'] ], title='System parameters')

%if not configs:
<center>
  <h3>No system information is available.</h3>
</center>
%else:
<table class="table table-condensed col-sm-12" style="table-layout: fixed; word-wrap: break-word;">
  <colgroup>
    <col style="width: 30%" />
    <col style="width: 70%" />
  </colgroup>
  <tbody style="font-size:x-small;">
    %for key, value in configs:
    <tr>
      <td>{{key}}</td>
      <td>
        %if type(value) is bool:
        {{! app.helper.get_on_off(value)}}
        %else:
        {{value}}
        %end
      </td>
    </tr>
    %end
  </tbody>
</table>
%end
