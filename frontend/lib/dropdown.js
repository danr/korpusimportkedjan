// Makes a select element look like a bootstrap dropdown:
// https://groups.google.com/forum/?fromgroups=#!topic/twitter-bootstrap-stackoverflow/S66cuS95wKQ
(function($) {
    $.fn.buttonSelect = function(separate_first) {
        this.hide().wrap('<div class="btn-group"/>');
        var select = this.parent();
        var selectedOption=this.find('option[selected]').length>0?this.find('option[selected]'):this.find('option:nth(0)');
        var currentValue = selectedOption.val();
        var currentText = selectedOption.text();
        select.html(
            '<button data-toggle="dropdown" class="btn dropdown-toggle" href="javascript:;">'+
                '<span>'+currentText+'</span>'+
                '&nbsp;&nbsp;<span class="caret"></span>'+
                '</button>'+
                '<input type="hidden" value="' + this.val() + '"/>'+
                '<ul class="dropdown-menu"></ul>');

        var dropdownMenu=select.find('.dropdown-menu');
        var first = true;
        this.find('option').each(function(o, q) {
            dropdownMenu.
                append('<li><a href="javascript:;" data-value="' + $(q).attr('value') + '">' + $(q).text() + '</a></li>');
            if (first && separate_first) {
                first = false;
                dropdownMenu.append('<li class="divider"/>');
            }
        });

        var hidden=select.find('input:hidden');
        var label=select.find('.btn span:nth(0)');
        hidden.on({
            change: function () {
				var a_query = 'a[data-value=' + $(this).val() + ']'
				label.text($(this).siblings().find(a_query).text());
            }
        });
        dropdownMenu.find('a').click(function() {
            hidden.val($(this).data('value')).change();
        });
		hidden.change();
        return this;
    };
})(jQuery);
