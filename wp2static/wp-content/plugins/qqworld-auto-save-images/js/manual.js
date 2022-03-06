jQuery(function($) {
	$(window).on('load', function() {
		var noty_theme = typeof qqworld_ajax == 'object' ? 'qqworldTheme' : 'defaultTheme',
		wait_img = '<img src=" data:image/gif;base64,R0lGODlhgAAPAKIAALCvsMPCwz8/PwAAAPv6+wAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQECgAAACwAAAAAgAAPAAAD50ixS/6sPRfDpPGqfKv2HTeBowiZGLORq1lJqfuW7Gud9YzLud3zQNVOGCO2jDZaEHZk+nRFJ7R5i1apSuQ0OZT+nleuNetdhrfob1kLXrvPariZLGfPuz66Hr8f8/9+gVh4YoOChYhpd4eKdgwAkJEAE5KRlJWTD5iZDpuXlZ+SoZaamKOQp5wEm56loK6isKSdprKotqqttK+7sb2zq6y8wcO6xL7HwMbLtb+3zrnNycKp1bjW0NjT0cXSzMLK3uLd5Mjf5uPo5eDa5+Hrz9vt6e/qosO/GvjJ+sj5F/sC+uMHcCCoBAAh+QQECgAAACwAAAAABwAPAAADEUiyq/wwyknjuDjrzfsmGpEAACH5BAQKAAAALAsAAAAHAA8AAAMRSLKr/DDKSeO4OOvN+yYakQAAIfkEBAoAAAAsFgAAAAcADwAAAxFIsqv8MMpJ47g46837JhqRAAAh+QQECgAAACwhAAAABwAPAAADEUiyq/wwyknjuDjrzfsmGpEAACH5BAQKAAAALCwAAAAHAA8AAAMRSLKr/DDKSeO4OOvN+yYakQAAIfkEBAoAAAAsNwAAAAcADwAAAxFIsqv8MMpJ47g46837JhqRAAAh+QQECgAAACxCAAAABwAPAAADEUiyq/wwyknjuDjrzfsmGpEAACH5BAQKAAAALE0AAAAHAA8AAAMRSLKr/DDKSeO4OOvN+yYakQAAIfkEBAoAAAAsWAAAAAcADwAAAxFIsqv8MMpJ47g46837JhqRAAAh+QQECgAAACxjAAAABwAPAAADEUiyq/wwyknjuDjrzfsmGpEAACH5BAQKAAAALG4AAAAHAA8AAAMRSLKr/DDKSeO4OOvN+yYakQAAIfkEBAoAAAAseQAAAAcADwAAAxFIsqv8MMpJ47g46837JhqRAAA7" />';

		if (wp !== 'undefined' && typeof wp.blocks !== 'undefined' && $('body').hasClass('block-editor-page')) {
			if (!$('#qqworld-gutenberg-toolbar-buttons').length) $('.edit-post-header__settings').prepend('<div id="qqworld-gutenberg-toolbar-buttons"><button type="button" class="components-button save_remote_images is-button is-default is-large" id="save-remote-images-button">'+QASI.save_remote_images+'</button></div>');
		}

		$('.mce-i-save_remote_images').closest('.mce-widget').hide();
		$(document).on('click', '#save-remote-images-button', function() {
			var mode = 'text';
			if (wp !== 'undefined' && typeof wp.blocks !== 'undefined' && $('body').hasClass('block-editor-page')) {
				mode = 'rich';
			} else if (tinyMCE.activeEditor) {
				var id = tinyMCE.activeEditor.id;
				mode = $('#'+id).is(':visible') ? 'text' : 'virtual';
			}
			var catch_error = function(XMLHttpRequest, textStatus, errorThrown) {
				console.log('XMLHttpRequest:');
				console.log(XMLHttpRequest);
				console.log('textStatus: ' + textStatus);
				console.log('errorThrown: ' + errorThrown);
				$('#save-remote-images-button').data('noty').close();
				noty({
					text: QASI.error,	
					type: 'error',
					layout: 'center',
					modal: true,
					theme: noty_theme
				});
			};
			
			$('#save-remote-images-button').data('noty', noty({
				text: wait_img + ' &nbsp; ' + QASI.in_process,	
				type: 'notification',
				layout: 'center',
				modal: true,
				closeWith: ['button'],
				theme: noty_theme
			}) );
			switch (mode) {
				case 'rich':
					var content = wp.data.select( "core/editor" ).getEditedPostContent();
					break;
				case 'text':
					var content = encodeURI($('#content').val());
					break;
				case 'virtual':
					var content = encodeURI(tinyMCE.activeEditor.getContent());
					break;						
			}
			
			$.ajax({
				type: "POST",
				url: ajaxurl,
				dataType: 'json',
				data: {
					action: 'save_remote_images',
					post_id: QASI.post_id,
					content: encodeURI(content)
				},
				success: function(respond) {
					var options = {
						text: respond.msg,
						layout: 'center',
						theme: noty_theme
					};
					switch (respond.type) {
						case 1:
							options.type = 'warning';
							options.timeout = 3000;
							break;
						case 2:
							options.type = 'success';
							options.timeout = 3000;
							break;
						case 3:
							options.type = 'error';
							options.modal = true;
							break;
					}
					$('#save-remote-images-button').data('noty').close();
					var n = noty(options);
					console.log(respond);
					if (respond.content) {
						switch (mode) {
							case 'rich':
								// 更新 text 模式
								wp.data.dispatch('core/editor').editPost( { content: respond.content } );
								// 更新 visual 模式
								var block = wp.blocks.createBlock( 'core/freeform', { content: respond.content } );
								wp.data.dispatch( 'core/editor' ).resetBlocks([block]);
								break;
							case 'text':
								$('#content').val(respond.content);
								break;
							case 'virtual':
								tinyMCE.activeEditor.setContent(respond.content);
								break;						
						}
						
					}
				},
				error: catch_error
			});
		});
	});
});