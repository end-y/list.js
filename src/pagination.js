var classes = require('./utils/classes'),
  events = require('./utils/events'),
  List = require('./index')

module.exports = function (list) {
  var isHidden = false

  var refresh = function (pagingList, options) {
    if (list.page < 1) {
      list.listContainer.style.display = 'none'
      isHidden = true
      return
    } else if (isHidden) {
      list.listContainer.style.display = 'block'
    }
    
    var item,
      l = list.matchingItems.length,
      index = list.i,
      page = list.page,
      pages = Math.ceil(l / page),
      currentPage = Math.ceil(index / page),
      innerWindow = options.innerWindow || 2,
      left = options.left || options.outerWindow || 0,
      right = options.right || options.outerWindow || 0
      right = options.select ? 0 : pages - right
    pagingList.clear()
    const buttons = typeof options.navigation == "object" ? options.navigation.buttonItems || [] : []
    
    if(options.navigation && currentPage > 1){
      item = pagingList.add({
        page: buttons[0] || '<<' ,
        dotted: true,
      })[0]
      item.elm.querySelector(stringToHtml(buttons[0]).tagName || "a").setAttribute('data-i', 1)
      item.elm.querySelector(stringToHtml(buttons[0]).tagName || "a").setAttribute('data-page', page)

      item = pagingList.add({
        page: buttons[1] || '<',
        dotted: true,
      })[0]
      item.elm.querySelector(stringToHtml(buttons[1]).tagName || "a").setAttribute('data-i', currentPage-1)
      item.elm.querySelector(stringToHtml(buttons[1]).tagName || "a").setAttribute('data-page', page)
    }

    for (var i = 1; i <= pages; i++) {
      var className = currentPage === i ? 'active' : ''

      //console.log(i, left, right, currentPage, (currentPage - innerWindow), (currentPage + innerWindow), className);
      
      if (is.number(i, left, right, currentPage, innerWindow)) {
        item = pagingList.add({
          page: i,
          dotted: false,
        })[0]
        if (className) {
          classes(item.elm).add(className)
        }
        if(options.select){
          item.elm.classList.add("select"+i)
          item.elm.setAttribute("value",i)
          item.elm.setAttribute('data-i', i)
          item.elm.setAttribute('data-page', page)
          item.elm.innerText = i
        }else{
          item.elm.firstChild.setAttribute('data-i', i)
          item.elm.firstChild.setAttribute('data-page', page)
        }
      } else if (is.dotted(pagingList, i, left, right, currentPage, innerWindow, pagingList.size()) && !options.navigation) {
        item = pagingList.add({
          page: '...',
          dotted: true,
        })[0]
        classes(item.elm).add('disabled')
      }
    }
    if(options.navigation && currentPage < pages){
      item = pagingList.add({
        page: buttons[2] || '>',
        dotted: true,
      })[0]
      item.elm.querySelector(stringToHtml(buttons[3]).tagName || "a").setAttribute('data-i', currentPage+1)
      item.elm.querySelector(stringToHtml(buttons[3]).tagName || "a").setAttribute('data-page', page)

      item = pagingList.add({
        page: buttons[3] || '>>',
        dotted: true,
      })[0]
      item.elm.querySelector(stringToHtml(buttons[3]).tagName || "a").setAttribute('data-i', pages)
      item.elm.querySelector(stringToHtml(buttons[3]).tagName || "a").setAttribute('data-page', page)
    }

  }
  const stringToHtml = (str) => {
    let parser = new DOMParser()
    if(str)
      return parser.parseFromString(str, "text/html").querySelector("body").firstChild
    return false
  }
  const getSelected = () => {
    let el = Array.from(document.querySelectorAll(".page")).find(e => Array.from(e.classList).includes("active"))
    el.setAttribute("selected",true)
  }
  var is = {
    number: function (i, left, right, currentPage, innerWindow) {
      return this.left(i, left) || this.right(i, right) || this.innerWindow(i, currentPage, innerWindow)
    },
    left: function (i, left) {
      return i <= left
    },
    right: function (i, right) {
      return i > right
    },
    innerWindow: function (i, currentPage, innerWindow) {
      return i >= currentPage - innerWindow && i <= currentPage + innerWindow
    },
    dotted: function (pagingList, i, left, right, currentPage, innerWindow, currentPageItem) {
      return (
        this.dottedLeft(pagingList, i, left, right, currentPage, innerWindow) ||
        this.dottedRight(pagingList, i, left, right, currentPage, innerWindow, currentPageItem)
      )
    },
    dottedLeft: function (pagingList, i, left, right, currentPage, innerWindow) {
      return i == left + 1 && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right)
    },
    dottedRight: function (pagingList, i, left, right, currentPage, innerWindow, currentPageItem) {
      if (pagingList.items[currentPageItem - 1].values().dotted) {
        return false
      } else {
        return i == right && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right)
      }
    },
  }

  return function (options) {
    var pagingList = new List(list.listContainer.id, {
      listClass: options.paginationClass || 'pagination',
      item: options.select ? "<option class='page'></option>" : options.item || "<li><a class='page' href='#'></a></li>",
      valueNames: ['page', 'dotted'],
      searchClass: 'pagination-search-that-is-not-supposed-to-exist',
      sortClass: 'pagination-sort-that-is-not-supposed-to-exist',
    })
    const event = options.select ? "change" : "click"
    events.bind(pagingList.listContainer, event, function (e) {
        var target 
        if(event == "change"){
          var newlist = Array.from(document.querySelector("."+e.target.className).children)
          target = newlist[parseInt(e.target.value)-1]
          
          getSelected()
        }else{
          target = e.target || e.srcElement
        }
        
        var page = list.utils.getAttribute(target, 'data-page'),
        i = list.utils.getAttribute(target, 'data-i')
      if (i) {
        list.show((i - 1) * page + 1, page)
      }
    })

    list.on('updated', function () {
      refresh(pagingList, options)
      getSelected()
    })
    refresh(pagingList, options)
  }
}
