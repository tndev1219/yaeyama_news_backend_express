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

var DatatableDataLocalDemo = {
    init:function() {
        var e,a,i,event_data;
        $.ajax({
            type: 'POST',       
            url:'/getAllNews',
            success: function(response) {
                var del_btn_obj;
                event_data = response.result;
                e=event_data;
                a=$(".m_data_events").mDatatable(
                    {data:
                        {type:"local",source:e,pageSize:10},
                        layout:{theme:"default",class:"",scroll:!1,footer:!1},
                        sortable:!0,
                        pagination:!0,
                        search:{input:$("#eventSearch")},
                        columns:[
                            {field:"",title:"",width:30},
                            {field:"date",title:"日付",width:150,class:"m-date-field"},
                            {field:"title",title:"ファイル名",sortable:!1,class:"m-title-field",responsive:{visible:"lg"}},
                            {field:"description",title:"説明文",responsive:{visible:"lg"},sortable:!1},
                            {field: "Actions",title: "機能",width:80,sortable: !1,overflow: "visible",textAlign:"center",
                                template: function (e, a, i) {
                                    return '<button class="m-portlet__nav-link btn m-btn m-btn--hover-accent m-btn--icon m-btn--icon-only m-btn--pill m-btn-view" title="見る" data-url="'+e.url+'">\
                                        <i class="la flaticon-eye"></i></button>\
                                        <button class="m-portlet__nav-link btn m-btn m-btn--hover-accent m-btn--icon m-btn--icon-only m-btn--pill m-btn-delete" title="削除" data-date="'+e.date+'" data-toggle="modal" data-target="#m_modal_5">\
                                        <i class="la flaticon-delete-1"></i></button>';
                                }
                            },
                            {field:"",title:"",width:30},
                        ]
                    }
                );
                i=a.getDataSourceQuery();
                $("#m_form_status").on("change",function(){
                    a.search($(this).val(),"Status");
                }).val(void 0!==i.Status?i.Status:"");
                $("#m_form_type").on("change",function(){
                    a.search($(this).val(),"Type");
                }).val(void 0!==i.Type?i.Type:"");
                $("#m_form_status, #m_form_type").selectpicker();                
                $('.m_data_events').on('click', '.m-btn-view', function(){
                    window.open($(this)[0].dataset.url);
                });
                $('.m_data_events').on('click', '.m-btn-delete', function(){
                    del_btn_obj = $(this);
                });
                $('.m-modal-btn-delete').on('click', function(){
                    var form = $("#m-datatable");
                    $.ajax({
                        type: 'POST',
                        url: '/deleteNews',
                        data: {
                            date: del_btn_obj[0].dataset.date
                        },
                        success: function(response){
                            console.log(response);
                            if (response.code == 200) {
                                del_btn_obj.parents('tr').remove();
                                showErrorMsg(form, 'success', '削除に成功しました。');
                            } else {
                                showErrorMsg(form, 'danger', '操作が失敗しました。 しばらくしたら,また試してください。');    
                            }
                        },
                        error: function(error){
                            console.log(error);
                            showErrorMsg(form, 'danger', '操作が失敗しました。 しばらくしたら,また試してください。');
                        }
                    });                    
                });
            },
            error: function(error){
                console.log(error);
            }
        });
    }
};

jQuery(document).ready(function(){
    DatatableDataLocalDemo.init();
});