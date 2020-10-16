var showErrorMsg = function(form, type, msg) {
    var alert = $('<div class="m-alert m-alert--outline alert alert-' + type + ' alert-dismissible" role="alert" style="margin-left:30px;margin-right:30px;margin-top:10px">\
        <button type="button" class="close" data-dismiss="alert" aria-label="Close"></button>\
        <span></span>\
    </div>');
    form.find('.alert').remove();
    alert.prependTo(form);
    mUtil.animateClass(alert[0], 'fadeIn animated');
    alert.find('span').html(msg);
};

$(document).ready(function() {
    $('#datepicker').datepicker();
    $('#uploadForm').submit(function() {
        var form = $(this);
        var btn = $("#btn_upload");
        form.validate({
            rules: {
                uploadDate: {
                    required: true,
                },                
                fileupload: {
                    required: true
                },
            }
        });
        if (!form.valid()) {
            return false;
        }
        btn.addClass('m-loader m-loader--right m-loader--light').attr('disabled', true);
        form.ajaxSubmit({
            type:'POST',
            url: '/uploadNews',
            success: function(response, status, xhr, $form) {
                console.log(response);
                if (response.code == 200) {
                    btn.removeClass('m-loader m-loader--right m-loader--light').attr('disabled', false);
                    form.clearForm();
                    form.validate().resetForm();
                    $('.custom-file-label').html('Choose file');
                    showErrorMsg(form, 'success', '成果的にアップロードされました。!');
                } else if(response.code == 402) {
                    btn.removeClass('m-loader m-loader--right m-loader--light').attr('disabled', false);
                    showErrorMsg(form, 'danger', 'ファイルが既に存在します。 新しいファイルをアップロードするためにはファイルを削除してください。');
                } else {
                    btn.removeClass('m-loader m-loader--right m-loader--light').attr('disabled', false);
                    showErrorMsg(form, 'danger', '操作が失敗しました。 しばらくしたら,また試してください。');
                }
            },
            error: function(data){
                btn.removeClass('m-loader m-loader--right m-loader--light').attr('disabled', false);
                showErrorMsg(form, 'danger', '操作が失敗しました。 しばらくしたら,また試してください。');
            }
        });
        return false;
   });    
});
