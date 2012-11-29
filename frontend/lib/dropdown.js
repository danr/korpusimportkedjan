// Makes a select element look like a bootstrap dropdown:
// https://groups.google.com/forum/?fromgroups=#!topic/twitter-bootstrap-stackoverflow/S66cuS95wKQ
//
// Tweaked to accept change events on the hidden to update the dropdown label,
// also added localization. Localization from the options in data-loc-se and data-loc-en
// are added to the links and the label. This requires $.fn.localize() to be initialized.
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

        function copy_loc(key, from, to) {
            key = 'data-loc-' + key
            if ($(from).attr(key)) {
                $(to).attr(key,$(from).attr(key));
            }
        }

        function copy_locs(from, to) {
            // always fall back to text content for English
            $(to).attr('data-loc-en', $(from).text())
            // and then try to populate from the data-loc fields
            copy_loc('en', from, to);
            copy_loc('se', from, to);
        }

        this.find('option').each(function(o, q) {
            var a = $('<a href="javascript:;" data-value="' + $(q).attr('value') + '"/>');
            copy_locs(q, a);
            a.localize()
            dropdownMenu.append($('<li/>').append(a));
            if (first && separate_first) {
                first = false;
                dropdownMenu.append('<li class="divider"/>');
            }
        });

        var hidden=select.find('input:hidden');
        var label=select.find('.btn span:nth(0)');
        hidden.on({
            change: function () {
				var a_query = 'a[data-value=' + $(this).val() + ']';
                copy_locs(a_query, label);
                label.localize();
            }
        });
        dropdownMenu.find('a').click(function() {
            hidden.val($(this).data('value')).trigger('change');
        });
		hidden.trigger('change');
        return this;
    };
})(jQuery);

