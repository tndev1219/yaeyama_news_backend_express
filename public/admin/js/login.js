var Login = function () {

    var showErrorMsg = function (form, type, msg) {
        var alert = $('<div class="m-alert m-alert--outline alert alert-' + type + ' alert-dismissible" role="alert">' + 
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close"></button><span></span></div>');

        form.find('.alert').remove();
        alert.prependTo(form);
        // alert.animateClass('fadeIn animated');
        mUtil.animateClass(alert[0], 'fadeIn animated');
        alert.find('span').html(msg);
    };

    var handleSignInFormSubmit = function () {
        $('#m_login_signin_submit').click(function (e) {
            e.preventDefault();
            var btn = $(this);
            var form = $(this).closest('form');
            form.validate({
                rules: {
                    userid: {
                        required: true,
                    },
                    password: {
                        required: true
                    }
                }
            });
            if (!form.valid()) {
                return;
            }
            btn.addClass('m-loader m-loader--right m-loader--light').attr('disabled', true);
            form.ajaxSubmit({
                type: 'POST',
                url: '/signin',
                success: function (response, status, xhr, $form) {
                    if (response.code == 200) {
                        window.location.href = '/all_news';
                    } else if (response.code == 401) {
                        btn.removeClass('m-loader m-loader--right m-loader--light').attr('disabled', false);
                        showErrorMsg(form, 'danger', 'ユーザIDやパスワードが正確ではありません。 また入力してください。');
                    } else {
                        btn.removeClass('m-loader m-loader--right m-loader--light').attr('disabled', false);
                        showErrorMsg(form, 'danger', '操作が失敗しました。 しばらくしたら,また試してください。');
                    }
                },
                error: function (data) {
                    btn.removeClass('m-loader m-loader--right m-loader--light').attr('disabled', false);
                    showErrorMsg(form, 'danger', '操作が失敗しました。 しばらくしたら,また試してください。');
                }
            });
        });
    };
    return {
        init: function () {
            handleSignInFormSubmit();
        }
    };
}();

jQuery(document).ready(function () {
    Login.init();
});
