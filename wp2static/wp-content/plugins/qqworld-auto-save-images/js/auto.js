jQuery(function($) {
	var loop;
	var listen = {
		start: function() {
			loop = setInterval(listen.loop, 500);
		},
		loop: function() {
			if (!$('.components-button.editor-post-publish-button').hasClass('is-busy')) {
			console.log(1)
				listen.end();
				// 检查有没有远程图片
				$.ajax({
					url: ajaxurl,
					type: 'post',
					data: {
						action: 'save_remote_images-get-auto-saved-results',
						post_id: wp.data.select( "core/editor" ).getCurrentPost().id
					},
					dataType: 'json',
					success: function(respond) {
						//console.log(respond);
						if (respond) {
							/////////////////////////////////////////////////////////////
							// 将更新后的内容刷新到编辑器
							var content = respond.post_content;
							// 更新 text 模式
							wp.data.dispatch('core/editor').editPost( { content: content } );
							// 更新 visual 模式
							var block = wp.blocks.createBlock( 'core/freeform', { content: content } );
							wp.data.dispatch( 'core/editor' ).resetBlocks([block]);
							/////////////////////////////////////////////////////////////
							// 如果有特色图，和当前的不一样就刷新一下
							if (typeof respond.thumbnail_id != 'undefined') {
								//if (wp.data.select( "core/editor" ).getCurrentPost().featured_media != respond.thumbnail_id) {
									wp.data.dispatch('core/editor').editPost( { featured_media: respond.thumbnail_id } );
								//}
							}
							
						}
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {
						console.log(XMLHttpRequest);
					}
				});
			}
		},
		end: function() {
			clearInterval(loop);
		}
	};

	var noty_theme = typeof qqworld_ajax == 'object' ? 'qqworldTheme' : 'defaultTheme',
	wait_img = '<img src=" data:image/gif;base64,R0lGODlhgAAPAKIAALCvsMPCwz8/PwAAAPv6+wAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQECgAAACwAAAAAgAAPAAAD50ixS/6sPRfDpPGqfKv2HTeBowiZGLORq1lJqfuW7Gud9YzLud3zQNVOGCO2jDZaEHZk+nRFJ7R5i1apSuQ0OZT+nleuNetdhrfob1kLXrvPariZLGfPuz66Hr8f8/9+gVh4YoOChYhpd4eKdgwAkJEAE5KRlJWTD5iZDpuXlZ+SoZaamKOQp5wEm56loK6isKSdprKotqqttK+7sb2zq6y8wcO6xL7HwMbLtb+3zrnNycKp1bjW0NjT0cXSzMLK3uLd5Mjf5uPo5eDa5+Hrz9vt6e/qosO/GvjJ+sj5F/sC+uMHcCCoBAAh+QQECgAAACwAAAAABwAPAAADEUiyq/wwyknjuDjrzfsmGpEAACH5BAQKAAAALAsAAAAHAA8AAAMRSLKr/DDKSeO4OOvN+yYakQAAIfkEBAoAAAAsFgAAAAcADwAAAxFIsqv8MMpJ47g46837JhqRAAAh+QQECgAAACwhAAAABwAPAAADEUiyq/wwyknjuDjrzfsmGpEAACH5BAQKAAAALCwAAAAHAA8AAAMRSLKr/DDKSeO4OOvN+yYakQAAIfkEBAoAAAAsNwAAAAcADwAAAxFIsqv8MMpJ47g46837JhqRAAAh+QQECgAAACxCAAAABwAPAAADEUiyq/wwyknjuDjrzfsmGpEAACH5BAQKAAAALE0AAAAHAA8AAAMRSLKr/DDKSeO4OOvN+yYakQAAIfkEBAoAAAAsWAAAAAcADwAAAxFIsqv8MMpJ47g46837JhqRAAAh+QQECgAAACxjAAAABwAPAAADEUiyq/wwyknjuDjrzfsmGpEAACH5BAQKAAAALG4AAAAHAA8AAAMRSLKr/DDKSeO4OOvN+yYakQAAIfkEBAoAAAAseQAAAAcADwAAAxFIsqv8MMpJ47g46837JhqRAAA7" />';

	$(document).on('click', '.components-button.editor-post-publish-button', listen.start); // 开始监听
});