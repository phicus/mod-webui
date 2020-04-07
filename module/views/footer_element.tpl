%from shinken.bin import VERSION
%setdefault('elt', None)
%setdefault('user', None)
%setdefault('all_pbs', None)
%import time

%KRILL_VERSION = '0.10'

%username = 'anonymous'
<!-- Footer -->
<footer class="hidden-xs">
   <nav class="navbar navbar-default navbar-fixed-bottom">
      <div class="container-fluid">
         <a href="javascript:;" onclick="swappSidebar()"><i class="fa fa-bars"></i></a>
         <span onclick="display_modal('/modal/about')">
            <!--<img src="/static/images/default_company_xxs.png" alt="Shinken Logo"/>-->
            <small><em class="text-muted">
               Shinken {{VERSION}} &mdash; Web User Interface {{app.app_version}}, &copy;2011-2016
            </em></small>
            <span class="glyphicon glyphicon-plus"></span>&nbsp;
            <img src="//phicus.es/wp-content/uploads/2017/01/logo_phicus_web.png" alt="Phicus Logo" height="24px" onclick="display_modal('/modal/about-phicus')"/>
            <small><em class="text-muted">
               Krill {{KRILL_VERSION}} &mdash; KrillUI User Interface, Phicus &copy;2017-{{ time.strftime("%Y") }}
            </em></small>
         </span>
      </div>
   </nav>
</footer>
<script lang="js" language="JavaScript">
   function swappSidebar() {
       var $sidebar = $('.navbar-default.sidebar');
       var leftMargin = 0;
       if ($sidebar.hasClass('hide')) {
           $sidebar.removeClass('hide');
           leftMargin = 220;
       } else {
           $sidebar.addClass('hide');
       }
       $('#page-wrapper').css('margin-left', leftMargin);
   }
</script>