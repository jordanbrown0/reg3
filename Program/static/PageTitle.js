function PageTitle() {
	var o = this;
	PageTitle.sup.constructor.call(o, 'title');
}

extend(DElement, PageTitle);

PageTitle.prototype.set = function (e) {
	var o = this;
	
	o.removeChildren();
	o.appendChild(e);
};

var pageTitle;

init.push(function pageTitleInit() {
		pageTitle = new PageTitle();
        document.head.appendChild(pageTitle.n);
});
