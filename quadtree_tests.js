function naiveSearch(pointList, x, y)
{
	var naiveNearest = [],
		naiveSqDistance = Number.MAX_VALUE;
		
	for (var j=0; j<pointList.length; j++)
	{
		var dx = x - pointList[j].x,
			dy = y - pointList[j].y;
			
		var sqDist = dx * dx + dy * dy;
		
		if (sqDist < naiveSqDistance)
		{
			naiveSqDistance = sqDist;
			naiveNearest = [pointList[j]];
		}
		else if (sqDist == naiveSqDistance)
		{
			naiveNearest.push(pointList[j]);
		}
	}
	
	return {
		sqDistance: naiveSqDistance, 
		points: naiveNearest
	};
}

function sortList(nearestResult)
{
	nearestResult.points.sort(function(x,y){ 
		return x.x - y.x == 0 ? x.y - y.y : x.x - y.x;
	});	
}
/*
test( "quadtree continuous randomized test", function() {
	var d = 1000; //Dimension
	var a = 10000; //Number of points to add
	var r = 500; //Number of points to remove
	var q = 10000; //Number of test queries
	
	var qt = new Craxic.QuadTree(0, 0, d, d);
	var pointList = [];
	
	for (var i=0; i<a; i++)
	{
		var point = {
			x: Math.random() * d,
			y: Math.random() * d
		};
		
		pointList.push(point);
		qt.add(point);
	}
	
	for (var j=0; j<r; j++)
	{
		qt.remove(pointList[j]);
	}
	
	pointList.splice(0, r);
	
	for (var i=0; i<q; i++)
	{
		var x = Math.random() * d,
			y = Math.random() * d;
			
		var nearest = qt.nearestPoint(x,y);
		var naive = naiveSearch(pointList, x, y);
		
		sortList(nearest);
		sortList(naive);
		
		deepEqual(naive, nearest, "Naive implementation must equal QuadTree implementation");
	}
});


test( "quadtree discrete randomized test", function() {
	var d = 100; //Dimension
	var a = 10000; //Number of points to add
	var r = 500; //Number of points to remove
	var q = 10000; //Number of test queries
	
	var qt = new Craxic.QuadTree(0, 0, d, d);
	var pointList = [];
	
	for (var i=0; i<a; i++)
	{
		var point = {
			x: Math.floor(Math.random() * d),
			y: Math.floor(Math.random() * d)
		};
		
		pointList.push(point);
		qt.add(point);
	}
	
	for (var j=0; j<r; j++)
	{
		qt.remove(pointList[j]);
	}
	
	pointList.splice(0, r);
	
	for (var i=0; i<q; i++)
	{
		var x = Math.floor(Math.random() * d),
			y = Math.floor(Math.random() * d);
			
		var nearest = qt.nearestPoint(x,y);
		var naive = naiveSearch(pointList, x, y);
		
		sortList(nearest);
		sortList(naive);
		
		deepEqual(naive, nearest, "Naive implementation must equal QuadTree implementation");
	}
});*/


test( "quadtree basic test", function() {	
	var d = 100; //Dimension
	for (var v=0; v<16; v++)
	{
		var qt = new Craxic.QuadTree(0, 0, d, d);
		qt.maxDepth = v;
		
		var pointList = [];
		
		for (var i=0; i<64; i++)
		{
			var point = {
				x: 0,
				y: 0
			};
			
			pointList.push(point);
			qt.add(point);
		}
		
		function countNum(quad)
		{
			if (quad.points === null)
			{
				var sum = 0;
				sum += countNum(quad.topLeft);
				sum += countNum(quad.topRight);
				sum += countNum(quad.bottomLeft);
				sum += countNum(quad.bottomRight);
				return 1 + sum;
			}
			return 1;
		}
		
		ok(true, "EXPECT: " + v + " " + countNum(qt));
	}
});


test( "quadtree nearest neighbour time test", function() {
	expect(0);
	
	var d = 100; //Dimension
	var a = 1000000; //Number of points to add
	var r = 500; //Number of points to remove
	var q = 1000; //Number of test queries
	
	var qt = new Craxic.QuadTree(0, 0, d, d);
	qt.maxDepth = 6;
	var pointList = [];
	
	for (var i=0; i<a; i++)
	{
		var point = {
			x: Math.floor(Math.random() * d),
			y: Math.floor(Math.random() * d)
		};
		
		pointList.push(point);
		qt.add(point);
	}
	
	for (var j=0; j<r; j++)
	{
		qt.remove(pointList[j]);
	}
	
	pointList.splice(0, r);
	
	for (var i=0; i<q; i++)
	{
		var x = Math.floor(Math.random() * d),
			y = Math.floor(Math.random() * d);
			
		var nearest = qt.nearestPoint(x,y);
		
		sortList(nearest);
	}
});


test( "naive nearest neighbour time test", function() {
	expect(0);

	var d = 100; //Dimension
	var a = 1000000; //Number of points to add
	var r = 500; //Number of points to remove
	var q = 1000; //Number of test queries
	
	var pointList = [];
	
	for (var i=0; i<a; i++)
	{
		var point = {
			x: Math.floor(Math.random() * d),
			y: Math.floor(Math.random() * d)
		};
		
		pointList.push(point);
	}
	
	pointList.splice(0, r);
	
	for (var i=0; i<q; i++)
	{
		var x = Math.floor(Math.random() * d),
			y = Math.floor(Math.random() * d);
			
		var nearest = naiveSearch(pointList, x,y);
		
		sortList(nearest);
	}
});