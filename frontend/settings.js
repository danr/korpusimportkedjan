
/* Loads an example and sets the form accordingly */
function loadExample(xml_editor, ex) {

    function setTag(t,v) {
        $("#" + t + "_tag").val(v.tag);
        $("#" + t + "_controls").replaceWith(mkAttributes(t,t == "word",v.attributes));
    }

    setTag("root",ex.root);

    $.each(["word","sentence","paragraph"], function(_ix,segmenter) {
        v = ex[segmenter + "_segmenter"];
        if (typeof v == "string") {
            var tabstring = v;
        } else {
            var tabstring = 'custom';
        }
        setTag(segmenter,v);
        var tab = $('li[data-target=#' + segmenter + "_" + tabstring + ']');
        tab.tab('show');
        tab.addClass('active');

    });

    xml_editor.setValue(ex.corpus_xml);

    $('#generate').children().removeClass("active");
    $.each(ex.attributes,function (_ix,attr) {
        $('#generate_' + attr).addClass("active");
    });

    updateGenerateBoxes();
}

/* Making the Json object */

// str is one of "word", "sentence", "paragraph"
function activeTab(str) {
    var targets = $('ul .active').map(function () { return this.dataset.target; });
    var res = null;
    targets.map(function () {
        if (this.indexOf("#" + str) == 0) {
            res = this.slice(this.indexOf('_') + 1);
        }
    });
    return res;
}

function tagSetting(str) {
    var attributes = null;
    $('.' + str + '-attribute').map(function (idx) {
        var positional = $(this).siblings().find('input[type=hidden]');
        if (positional.length == 1) {
            attributes = attributes || {};
            var p = positional.val();
            attributes[$(this).val()] = p == "custom" ? null : p;
        } else {
            attributes = attributes || [];
            attributes[idx] = $(this).val();
        }
    });
    return {
        tag: $('#' + str + '_tag').val(),
        attributes: attributes || []
    };
}


// str is one of "word", "sentence", "paragraph"
function segmenterSetting(str) {
    var active = activeTab(str);
    if (active.indexOf('custom') != -1) {
        return tagSetting(str);
    } else {
        return active;
    }
}

function mkJsonSetting() {
    var active_attributes = $('#generate').find('.active').map(function () { return $(this).text(); }).get();
    $('.word-attribute').siblings().find('input:hidden').map(function () {
		active_attributes.concat($(this).val());
	});
    return {
        corpus: "",
        word_segmenter: segmenterSetting('word'),
        sentence_segmenter: segmenterSetting('sentence'),
        paragraph_segmenter: segmenterSetting('paragraph'),
        root: tagSetting('root'),
        extra_tags: [],
        attributes: ["word"].concat(active_attributes)
    };
}
