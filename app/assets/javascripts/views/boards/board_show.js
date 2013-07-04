Kanban.Views.BoardShow = Backbone.View.extend({
  template: JST['boards/show'],
  tagName: "section",
  className: "board-show",

  initialize: function () {
    var that = this;

    that.model.on('reset', this.render, this);
    that.model.on('add', this.render, this);
    that.model.on('remove', this.render, this);
  },

  events: {
    "click div.card": "cardClick",
    "submit form.add_list": "addList",
    "click button.archive_list": "archiveList",
    "submit form.add_card": "addCard",
    "click button.archive_card": "archiveCard",
  },

  addCard: function (event) {
  	var that = this;

    var board = that.model;
  	event.preventDefault();

  	// get form attrs, reset form
  	var $form = $(event.target);
		var attrs = $form.serializeJSON();
		$form[0].reset();

		// add list_id to attrs
		var listId = parseInt($(event.target).data("list-id"));    
		attrs.card.list_id = listId;

		// get list, create new card
    var list = board.getList(listId);
		var card = new Kanban.Models.Card();

		// save card
		card.save(attrs.card, {
			success: function (data) {
				list.cards().add(card);
				board.trigger("add");
			}
		});
  },

  archiveCard: function (event) {
  	var that = this;

    var board = that.model;
    event.stopPropagation();

  	console.log("archive card");

    var cardId = parseInt($(event.target).data("card-id"));
    var card = board.getCard(cardId);
    var list = board.getList(card.get("list_id"));

		// remove list
		card.destroy({
			success: function (data) {
				list.cards().remove(card);
		    board.trigger("remove");
			}
		});		
  },

  addList: function (event) {
  	var that = this;

    var board = that.model;
  	event.preventDefault();

  	// get form attrs, reset form
  	var $form = $(event.target);
		var attrs = $form.serializeJSON();
		$form[0].reset();

		// add board_id to attrs, create new list
		attrs.list.board_id = board.id;
		var list = new Kanban.Models.List();	

		// save list
		list.save(attrs.list, {
			success: function (data) {
				var lists = board.lists();
				lists.add(list);
				board.trigger("add");
			}
		});
  },

  archiveList: function (event) {
  	var that = this;

    var board = that.model;
    event.stopPropagation();

  	console.log("archive list");

    var listId = parseInt($(event.target).data("list-id"));
    var lists = board.lists();
    var list = lists.get(listId);    

		// remove list
		list.destroy({
			success: function (data) {
				lists.remove({ id: listId });
		    console.log(lists);
		    board.trigger("remove");
			}
		});		
  },

  cardClick: function (event) {
  	var that = this;

    var board = that.model;
    event.stopPropagation();

    var cardId = parseInt($(event.target).data("card-id"));    
    var $cardModal = that.$el.find("section.card_detail");

    var card = board.getCard(cardId);
    var cardShow = new Kanban.Views.CardShow({
      model: card
    });

  	$cardModal.html(cardShow.render().$el);
  	$cardModal.find("article.card_detail").modal();
  },

  render: function () {
    var that = this;

    console.log("render board");

    var board = that.model;
    var lists = board.lists();
    var renderedContent = that.template({
      board: board,
      lists: lists,
    });

    that.$el.html(renderedContent);

    sortListsUrl = "/api/lists/sort"
    var $lists = that.$el.find("div.lists");
    $lists.sortable({
      items: "div.list",
    	tolerance: "pointer",
      placeholder: "list-placeholder",
 			start: function(e, ui){
      	ui.placeholder.height(ui.item.height());
    	},
      update: function (data) {
        var sortData = $(this).sortable("serialize");
        $.post(sortListsUrl, sortData, function (resortedLists) {
          board.set({ lists: new Kanban.Collections.Lists(resortedLists) });
        });
      }
    });

    sortCardsUrl = "/api/cards/sort"
    var $cards = $lists.find("div.cards");
    $cards.sortable({
      items: "div.card",
      connectWith: ".cards",
      delay: 150,
    	tolerance: "pointer",
      placeholder: "card-placeholder",
 			start: function(e, ui){
      	ui.placeholder.height(ui.item.height());
    	},
      update: function (event, ui) {
        var sortData = $(this).sortable("serialize");

        if (sortData) {	        
	        // add list_id to sortData
	        var listId = parseInt($(this).data("listId"));
	        sortData += '&list_id=' + listId

	        $.post(sortCardsUrl, sortData, function (resortedLists) {
	          board.set({ lists: new Kanban.Collections.Lists(resortedLists) });
	        });
        };
      }
    });

    return that;
  }

});
