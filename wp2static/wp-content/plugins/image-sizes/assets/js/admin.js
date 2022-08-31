jQuery(function($){
	$('.image-sizes-help-heading').click(function(e){
		var $this = $(this);
		var target = $this.data('target');
		$('.image-sizes-help-text:not('+target+')').slideUp();
		if($(target).is(':hidden')){
			$(target).slideDown();
		}
		else {
			$(target).slideUp();
		}
	});

    // enable/disable
	var chk_all = $(".check-all");
	var chk_def = $(".check-all-default");
	var chk_cst = $(".check-all-custom");

	chk_all.change(function () {
	    $('.check-all-default,.check-all-custom').prop('checked',this.checked).change();
	});

	chk_def.change(function () {
	    $('.check-default').prop('checked',this.checked);
	    $('.check-this').change();
	});

	chk_cst.change(function () {
	    $('.check-custom').prop('checked',this.checked);
	    $('.check-this').change();
	});

	// counter
	$('.check-this').change(function(e){
		var total = $('.check-this').length;
		var enabled = $('.check-this:not(:checked)').length;
		var disabled = $('.check-this:checked').length;

		$('#disabled-counter .counter').text(disabled);
		$('#enabled-counter .counter').text(enabled);
	}).change();

	var limit = $('#image-sizes_regenerate-thumbs-limit').val();

	$("#image-sizes_regenerate-thumbs-limit").bind('keyup mouseup', function () {
	    limit = $(this).val();            
	});

	// var limit 	= 50;
	var offset 	= 0;
	var thumbs_deleted 	= 0;
	var thumbs_created 	= 0;

	function regenerate( limit, offset, thumbs_deleted, thumbs_created ) {
		$.ajax({
				url: IMAGE_SIZES.ajaxurl,
				type: 'GET',
				data: { action : 'image_sizes-regen-thumbs', 
				'offset' : offset, 
				'limit' : limit, 
				'thumbs_deleteds' : thumbs_deleted, 
				'thumbs_createds' : thumbs_created, 
				'_nonce' : IMAGE_SIZES.nonce 
			},
			success: function(res) {
				if ( res.has_image ) {
					var progress = res.offset / res.total_images_count * 100;
					$('.image-sizes-progress-content').text(Math.ceil( progress ) + '%').css({'width': progress + '%'});

					regenerate( limit, res.offset, res.thumbs_deleted, res.thumbs_created );
				}
				else {
					$('#image_sizes-regen-thumbs').text(IMAGE_SIZES.regen).attr('disabled', false);
					$('#image_sizes-message').html(res.message).show();
					$('.image-sizes-progress-panel .image-sizes-progress-content').addClass('progress-full');
				}
				console.log(res);
			},
			error: function(err){
				$('#image_sizes-regen-thumbs').text(IMAGE_SIZES.regen).attr('disabled', false);
				console.log(err);
			}
		})
	}

	// cx-regen-thumbs
	$('#image_sizes-regen-thumbs').click(function(e){
		$('#image_sizes-regen-thumbs').text(IMAGE_SIZES.regening).attr('disabled', true);
		$('#image_sizes-message').html('').hide();
		$('.image-sizes-progress-panel').hide();

		regenerate( limit, offset, thumbs_deleted, thumbs_created );

		// $('#image_sizes-regen-wrap').append('<progress id="image_sizes-progress" value="0" max="100"></progress>');
		$('#image_sizes-regen-thumbs').after('<div class="image-sizes-progress-panel"><div class="image-sizes-progress-content" style="width:0%"><span>0%</span></div></div></div>');
	});

	// dismiss
	$('.image_sizes-dismiss').click(function(e){
		var $this = $(this);
		$this.parent().slideToggle();
		$.ajax({
			url: IMAGE_SIZES.ajaxurl,
			data: { action : 'image_sizes-dismiss', meta_key : $this.data('meta_key'), '_nonce' : IMAGE_SIZES.nonce  },
			type: 'GET',
			success: function(res) {
				console.log(res);
			},
			error: function(err){
				console.log(err);
			}
		})
	})

	$('#image_sizes-regen-wrap span').click(function(e){
		alert($(this).attr('title'));
	})

	$(document).on('click','#cx-optimized',function(e){
		$('#cx-nav-label-image-sizes_optimize').trigger('click');
	})

	// show pro demo
	$('.image_sizes-action').click(function(e){
		e.preventDefault();
		$('#image_sizes-optimize').attr('disabled',true);
		$('#image_sizes-pro-message').html('');

		var $form = $('#cx-free-optimize #cx-optimize');
		var $button = $(this);
		var $formData = $form.serializeArray();
		var $operation = $(this).attr('name') == 'analyze' ? 'analyze' : 'optimize';
		$button.val( $operation == 'optimize' ? IMAGE_SIZES.optimizing : IMAGE_SIZES.analyzing ).attr('disabled', true);
		$formData.push({ name: "operation", value: $operation });
		$.ajax({
			url: ajaxurl,
			type: 'POST',
			data: $formData,
			dataType: 'JSON',
			success: function(resp) {
				if( resp.status == 1 ) {
					$('#image_sizes-optimize').attr('disabled',false);
				}
				$button.val( $operation == 'optimize' ? IMAGE_SIZES.optimize : IMAGE_SIZES.analyze ).attr('disabled', false);
				console.log(resp);
				$('#image_sizes-pro-message').html(resp.html);
			},
			error: function(err) {
				$button.val( $operation == 'optimize' ? IMAGE_SIZES.optimize : IMAGE_SIZES.analyze ).attr('disabled', false);
				console.log(err);
			}
		})
	});

	init_draggable($('.draggable-item'));

	$('#sortable2').sortable({
		connectWith: '#sortable1, #sortable2',
		items: '.draggable-item, .sortable-item',
		start: function(event, ui) {
			$('#sortable1').sortable('enable');
			$('ul.image_sizes-sortable.disable li input').attr('name', 'disables[]');

			var _length = $('ul.image_sizes-sortable.disable li').length - 1;
			$('.image_sizes-default-thumbnails-panel h4 .disables-count').text( _length )

			var _length = $('ul.image_sizes-sortable.enable li').length;
			$('.image_sizes-default-thumbnails-panel h4 .enables-count').text( _length )
		},
		receive: function(event, ui) {
			if (ui.item.hasClass('ui-draggable')) {
				ui.item.draggable( "destroy" ); 
			}
		}
	});

	$('#sortable1').sortable({
		connectWith: '#sortable1, #sortable2',
		items: '.draggable-item, .sortable-item',
		receive: function(event, ui) {
			$('#sortable1').sortable('disable');
			var widget = ui.item;
			init_draggable(widget);
			$('ul.image_sizes-sortable.enable li input').attr('name', '');

			var _length = $('ul.image_sizes-sortable.disable li').length;
			$('.image_sizes-default-thumbnails-panel h4 .disables-count').text( _length )

			var _length = $('ul.image_sizes-sortable.enable li').length;
			$('.image_sizes-default-thumbnails-panel h4 .enables-count').text( _length )
		}
	});

	function init_draggable(widget) {
		widget.draggable({
			connectToSortable: '#sortable2',
			stack: '.draggable-item',
			revert: true,
			revertDuration: 200,
			start: function(event, ui) {
				$('#sortable1').sortable('disable');
			}
		});
	}
})