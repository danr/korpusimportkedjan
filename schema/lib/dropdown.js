// Makes a select element look like a bootstrap dropdown:
// https://groups.google.com/forum/?fromgroups=#!topic/twitter-bootstrap-stackoverflow/S66cuS95wKQ

(function($) {
    $.fn.buttonSelect = function() {
        this.hide().wrap('<div class="btn-group"/>');
        var select = this.parent();
        var selectedOption=this.find('option[selected]').length>0?this.find('option[selected]'):this.find('option:nth(0)');
        var currentValue = selectedOption.val();
        var currentText = selectedOption.text();
        select.html(
            '<input type="hidden" value="' + this.val() + '"/>'+
            '<a class="btn dropdown-toggle" data-toggle="dropdown" href="javascript:;">'+
                '<span>'+currentText+'</span>'+
                '&nbsp;&nbsp;<span class="caret"></span>'+
            '</a>'+
            '<ul class="dropdown-menu"></ul>');

        var dropdownMenu=select.find('.dropdown-menu');
        this.find('option').each(function(o, q) {
            dropdownMenu.
                append('<li><a href="javascript:;" data-value="' + $(q).attr('value') + '">' + $(q).text() + '</a></li>');
        });

        var hidden=select.find('input[type=hidden]');
        var label=select.find('.btn span:nth(0)');
        dropdownMenu.find('a').click(function() {
            hidden.val($(this).data('value')).change();
            label.text($(this).text());
        });

        return this;
    };
})(jQuery);
