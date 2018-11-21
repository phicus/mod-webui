%import time
%user = app.get_user()
%helper = app.helper
%datamgr = app.datamgr
%search_string = app.get_search_string()

%rebase("layout", title=title, js=['js/shinken-actions.js', 'js/jquery.sparkline.min.js', 'js/shinken-charts.js', 'problems/js/problems.js'], css=['problems/css/problems.css'], navi=navi, page="/all", elts_per_page=elts_per_page)

<script type="text/javascript">
   var actions_enabled = {{'true' if app.can_action() else 'false'}};
</script>

<!-- As strange as this may sound, this is not for mining bitcoins ;) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.2/rollups/aes.js"></script>
<script type="text/javascript">
$(function(){
   var code1 = "U2FsdGVkX1/2mR8m25r7lZUaIaGtlEFxTZ+X+IfSZr5B1EgDKz2hKB";
   var code2 = "n1yJB4tPYgY7HO+xednAMwv71UqSuuvj0OJRecQ0h72We+hSiwDPU=";
   var plain = CryptoJS.AES.decrypt(code1 + code2, $('#search').val().toLowerCase()).toString(CryptoJS.enc.Utf8);
   if (plain) { $('.page-header h3:first').html(plain); }
});
</script>

<!-- Problems filtering and display -->
<div id="problems">

   %include("_problems_synthesis.tpl", pbs=pbs, search_string=app.get_search_string())

   %if not pbs:
   <center>
     <div class="page-header">
       %if search_string:
       <h3>What a bummer! We couldn't find anything.</h3>
       <h3><small>Use the filters, the bookmarks, click on the links above, or try a new search query to find what you are looking for.</small></h3>
       %else:
       <h3>No host or service.</h3>
       %end
     </div>
   </center>

   %else:

   %from itertools import groupby
   %pbs = sorted(pbs, key=lambda x: x.business_impact, reverse=True)
   %for business_impact, bi_pbs in groupby(helper.sort_elements(pbs), key=lambda x: x.business_impact):
   %bi_pbs = list(bi_pbs)

   <h4 class="table-title">
     <a class="js-select-all" data-business-impact="{{ business_impact }}" data-state="off">
       <span class="original-label">
         <span class="hidden-xs">Business impact: </span>
         {{!helper.get_business_impact_text(business_impact, text=True)}}
       </span>
       <span class="onhover-label">
         <i class="fa fa-check"></i> Select all {{len(bi_pbs)}} elements
       </span>
     </a>
   </h4>

   <div class="panel panel-default">
   <!--<div class="panel-body">-->

      <table class="table table-condensed table-hover problems-table">
        <colgroup>
            <col style="width: 120px;"/>
            <col style="width: 30px;"/>
            <col class="host-column hidden-sm hidden-xs hidden-md"/>
            <col class="service-column hidden-sm hidden-xs"/>
            <col style="width: 100%;"/>
        </colgroup>
         <!--<thead><tr>-->
            <!--<th width="20px"></th>-->
            <!--[><th width="40px"></th><]-->
            <!--<th width="130px">State</th>-->
            <!--<th class="host-column hidden-sm hidden-xs hidden-md">Host</th>-->
            <!--<th class="service-column hidden-sm hidden-xs">Service</th>-->
            <!--[><th class="duration-column">Duration</th><]-->
            <!--<th width="100%">Output</th>-->
         <!--</tr></thead>-->

         <tbody>
         %previous_pb_host_name=None
         %for pb in bi_pbs:
            %if pb.__class__.my_type == 'service':
            %pb_host = pb.host
            %else:
            %pb_host = pb
            %end
            <tr data-toggle="collapse" data-target="#details-{{helper.get_html_id(pb)}}" data-item="{{helper.get_uri_name(pb)}}" class="accordion-toggle js-select-elt collapsed">
             <td title="{{pb.get_name()}} - {{pb.state}}
Since {{helper.print_date(pb.last_state_change, format="%d %b %Y %H:%M:%S")}}

Last check <strong>{{helper.print_duration(pb.last_chk)}}</strong>
Next check <strong>{{helper.print_duration(pb.next_chk)}}</strong>
%if (pb.check_freshness):
(Freshness threshold: {{pb.freshness_threshold}} seconds)
%end
"
                 data-placement="right"
                 data-container="body"
                 class="item-state font-{{pb.state.lower()}} text-center">
                   <div style="display: table-cell; vertical-align: middle; padding-right: 10px;">
                     <input type="checkbox" class="input-sm item-checkbox" value="" id="selector-{{helper.get_html_id(pb)}}" data-type="problem" data-business-impact="{{business_impact}}" data-item="{{helper.get_uri_name(pb)}}">
                     <div class="item-icon">
                       {{!helper.get_fa_icon_state(pb, useTitle=False)}}
                     </div>
                   </div>
                   <div style="display: table-cell; vertical-align: middle;">
                     <small>
                       <strong class="hidden-sm hidden-xs">{{ pb.state }}</strong><!--<br>-->
                       <!--<span title="Since {{time.strftime("%d %b %Y %H:%M:%S", time.localtime(pb.last_state_change))}}">-->
                         %if pb.state_type == 'HARD':
                         {{!helper.print_duration(pb.last_state_change, just_duration=True, x_elts=2)}}
                         %else:
                         attempt {{pb.attempt}}/{{pb.max_check_attempts}}
                         <!--soft state-->
                         %end
                       <!--</span>-->
                     </small>
                   </div>
               </td>
               <td class="text-muted">
                 %if pb.problem_has_been_acknowledged:
                 <i class="fa fa-check" title="Acknowledged"></i><br>
                 %end
                 %if pb.in_scheduled_downtime:
                 <i class="fa fa-clock-o" title="In scheduled downtime"></i><br>
                 %end
               </td>
               %aka = ''
               %if pb_host.alias and not pb_host.alias.startswith(pb_host.get_name()):
                 %aka = 'Aka %s' % pb_host.alias.replace(' ', '<br>')
               %end
               <td class="hidden-sm hidden-xs hidden-md">
                  %if pb.host_name != previous_pb_host_name:
                     <a href="/cpe/{{ pb.host_name }}" title="{{!aka}}" onclick="event.stopPropagation();">
                       {{ pb_host.get_name() if pb_host.display_name == '' else pb_host.display_name }}
                     </a>
                  %end
               </td>
               <td class="hidden-sm hidden-xs">
                  %if pb.host_name != previous_pb_host_name:
                 <span class="hidden-lg">
                   <a href="/cpe/{{ pb.host_name }}" title="{{!aka}}" onclick="event.stopPropagation()">
                     {{ pb_host.get_name() if pb_host.display_name == '' else pb_host.display_name }}
                   </a>

                   %if pb.__class__.my_type == 'service':
                   /
                   %end
                 </span>
                 %end
                  %if pb.__class__.my_type == 'service':
                  {{!helper.get_link(pb, short=True)}}
                  %end
                  %if len(pb.impacts) > 0:
                  <span class="label label-danger" title="This service has impacts">+ {{ len(pb.impacts) }}</span>
                  %end
                  <!--:TODO:maethor:170924: -->
                  <!--<div class="pull-right problem-actions">-->
                    <!--<i class="fa fa-plus"></i>-->
                  <!--</div>-->
               </td>
               <td class="row">
                  <div class="pull-right">
                     {{!helper.get_perfdata_pies(pb)}}&nbsp;

                     %if app.graphs_module.is_available():
                     %if pb.perf_data:
                        <a style="text-decoration: none; color: #333;" role="button" tabindex="0" data-toggle="popover-elt-graphs"
                           data-title="{{ pb.get_full_name() }}" data-html="true"
                           data-trigger="hover" data-placement="left"
                           data-item="{{pb.get_full_name()}}"
                           href="{{!helper.get_link_dest(pb)}}#graphs">
                           <i class="fa fa-line-chart"></i>
                        </a>
                     %end
                     %end

                     %if True:
                     %if True:
                        <a style="text-decoration: none; color: #333;" role="button" tabindex="1"
                           href="/cpe/{{pb.host_name}}">
                           <i class="fa fa-eye"></i>
                        </a>
                     %end
                     %end


                     %if True:
                     %if True:
                        <a style="text-decoration: none; color: #333;" role="button" tabindex="2"
                           href="{{ 'ok' }}">
                           <i class="fa fa-forward"></i>
                        </a>
                     %end
                     %end


                  </div>
                  <div class="ellipsis output">
                  <!--<div class="ellipsis output" style='font-family: "Liberation Mono", "Lucida Console", Courier, monospace; color=#7f7f7f; font-size:0.917em;'>-->
                    <div class="hidden-md hidden-lg">
                      <a href="/all?search=host:{{ pb.host_name }}" title="{{!aka}}">
                        {{ pb_host.get_name() if pb_host.display_name == '' else pb_host.display_name }}
                      </a>
                      %if pb.__class__.my_type == 'service':
                      / {{!helper.get_link(pb, short=True)}}
                      %end
                      %if len(pb.impacts) > 0:
                      <span class="label label-danger" title="This service has impacts">+ {{ len(pb.impacts) }}</span>
                      %end
                    </div>

                     <!--<br>-->

                    <samp class="hidden-xs" style="font-size:0.95em;">{{! pb.output}}</samp>
                     %if pb.long_output:
                     <div class="long-output">
                        {{! pb.long_output}}
                     </div>
                     %end
                  </div>
               </td>
            </tr>
            <tr class="hiddenRow">
               <td colspan="8">
                  <div class="accordion-body collapse" id="details-{{helper.get_html_id(pb)}}">
                    %include("_problems_eltdetail.tpl")
                  </div>
               </td>
            </tr>

         %previous_pb_host_name=pb.host_name
         %end
         </tbody>
      </table>
   <!--</div>-->
   </div>

   %end
 </div>

 <ul class='nav navbar-nav hidden' id='nav-actions'>
   %include('_problems_actions-navbar.tpl')
 </ul>
