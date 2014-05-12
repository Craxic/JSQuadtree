/*
** A Simple QuadTree implementation for Javascript.
**
** Copyright (c) 2014, Matthew Ready
** All rights reserved.
** 
** Redistribution and use in source and binary forms, with or without modification, are permitted 
** provided that the following conditions are met:
** 
** 1. Redistributions of source code must retain the above copyright notice, this list of conditions
**  and the following disclaimer.
** 
** 2. Redistributions in binary form must reproduce the above copyright notice, this list of 
** conditions and the following disclaimer in the documentation and/or other materials provided with
** the distribution.
** 
** 3. Neither the name of the copyright holder nor the names of its contributors may be used to 
** endorse or promote products derived from this software without specific prior written permission.
** 
** THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR 
** IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND 
** FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR 
** CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
** DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
** DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
** WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY
** WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
"use strict";

var Craxic = Craxic || {};

Craxic.QuadTree = function()
{
	/**
	* Implements a simple javascript QuadTree that has nearest-neighbor searching capabilities
	* Any object can be added as a point ("Point Object"). By default, the position of an object is 
	* retrieved from its values of 'x' and 'y'. This behaviour can be overridden in the 'config' 
	* argument.
	*
	* Behaviour is undefined if an object's values of x or y change without notifing the QuadTree
	* via {{#crossLink "QuadTree/objectMoved:method"}}{{/crossLink}}
	* 
	* @class QuadTree
	* @constructor
	* @param {Number} minX The minimum X of the QuadTree.
	* @param {Number} minY The minimum Y of the QuadTree.
	* @param {Number} maxX The maximum X of the QuadTree.
	* @param {Number} maxY The maximum Y of the QuadTree.
	* @param {Object} [config] A config object that contains various additional optional arguments.
	* @param {Array} [config.points=[]] 
	*        An array of objects to add as points after creation. For convenience.
	* @param {Function} [config.xAccessor=function(p){return p.x;}] 
	*        Function that accepts one point object argument and returns the x position of that 
	*        point object.
	* @param {Function} [config.yAccessor=function(p){return p.y;}] 
	*        Function that accepts one point object argument and returns the y position of that 
	*        point object.
	* @param {Function} [config.upperThreshold=8] 
	*        The maximum number of points in a leaf node.
	* @param {Function} [config.lowerThreshold=4] 
	*        If a parent nodes total number of contained points falls below this number, 
	*        it will merge all subtrees and become a leaf node.
	* @param {Number} [config.maxDepth=16] The maximum depth of the QuadTree
	*/
	var QuadTree = function(minX, minY, maxX, maxY, config) 
	{
		if (typeof minX !== "number"
		    || typeof minY !== "number"
			|| typeof maxX !== "number"
			|| typeof maxY !== "number")
		{
			throw new TypeError("QuadTree constructor boundary arguments must be numbers!");
		}
		
		// Copy arguments
		this.minX = minX;
		this.minY = minY;
		this.maxX = maxX;
		this.maxY = maxY;
		
		//New points
		this.points = [];
		
		if (config)
		{
			if (config.xAccessor)
			{
				if (typeof config.xAccessor !== "function")
					throw new TypeError("\"config.xAccessor\" can only be false or a Function");
				this.xAccessor = config.xAccessor;
			}
			
			if (config.yAccessor)
			{
				if (typeof config.yAccessor !== "function")
					throw new TypeError("\"config.yAccessor\" can only be false or a Function");
				this.yAccessor = config.yAccessor;
			}
			
			if (config.upperThreshold)
			{
				if (typeof config.upperThreshold !== "number")
					throw new TypeError("\"config.upperThreshold\" can only be false or a Number");
				this.upperThreshold = config.upperThreshold;
			}
			
			if (config.lowerThreshold)
			{
				if (typeof config.lowerThreshold !== "number")
					throw new TypeError("\"config.lowerThreshold\" can only be false or a Number");
				this.lowerThreshold = config.lowerThreshold;
			}
			
			if (config.maxDepth)
			{
				if (typeof config.maxDepth !== "number")
					throw new TypeError("\"config.maxDepth\" can only be false or a Number");
				this.maxDepth = config.maxDepth;
			}
				
			if (config.points)
			{
				var points = config.points;
				if (Object.prototype.toString.call(points) !== "[object Array]")
				{
					throw new TypeError("\"config.points\" can only be false or an instance of Array");
				}
				
				points.forEach(function (p) {
					this.add(p);
				});
			}
		}
	}
	
	// Member variables
	
	/**
	* Top left node of the QuadTree
	* 
	* @property topLeft
	* @type {QuadTree}
	* @default null
	* @private
	*/
	QuadTree.prototype.topLeft = null;
	/**
	* Top right node of the QuadTree
	* 
	* @property topRight
	* @type {QuadTree}
	* @default null
	* @private
	*/
	QuadTree.prototype.topRight = null;
	/**
	* Bottom left node of the QuadTree
	* 
	* @property bottomLeft
	* @type {QuadTree}
	* @default null
	* @private
	*/
	QuadTree.prototype.bottomLeft = null;
	/**
	* Bottom right node of the QuadTree
	* 
	* @property bottomRight
	* @type {QuadTree}
	* @default null
	* @private
	*/
	QuadTree.prototype.bottomRight = null;
	
	/**
	* The points that are contained within this QuadTree node.
	* If not null, it implies that this QuadTree object is a leaf node and that
	* {{#crossLink "QuadTree/topLeft:property"}}{{/crossLink}}, 
	* {{#crossLink "QuadTree/topRight:property"}}{{/crossLink}}, 
	* {{#crossLink "QuadTree/bottomLeft:property"}}{{/crossLink}} and 
	* {{#crossLink "QuadTree/bottomRight:property"}}{{/crossLink}} are all null.
	* On the other hand, if points is null, all the above properties contain a valid reference
	* to a QuadTree instance.
	* 
	* @property points
	* @type {QuadTree}
	* @default []
	* @private
	*/
	QuadTree.prototype.points = [];
	
	/**
	* The left most point of space that the QuadTree considers.
	* No point can be any further left than this or an error will occur.
	* 
	* @property minX
	* @type {Number}
	* @default Number.NaN
	* @private
	*/
	QuadTree.prototype.minX = Number.NaN;
	/**
	* The top most point of space that the QuadTree considers.
	* No point can be any further above this or an error will occur.
	* 
	* @property minY
	* @type {Number}
	* @default Number.NaN
	* @private
	*/
	QuadTree.prototype.minY = Number.NaN;
	/**
	* The right most point of space that the QuadTree considers.
	* No point can be any further right than this or an error will occur.
	* 
	* @property maxX
	* @type {Number}
	* @default Number.NaN
	* @private
	*/
	QuadTree.prototype.maxX = Number.NaN;
	/**
	* The bottom most point of space that the QuadTree considers.
	* No point can be any further below this or an error will occur.
	* 
	* @property maxY
	* @type {Number}
	* @default Number.NaN
	* @private
	*/
	QuadTree.prototype.maxY = Number.NaN;
	
	/**
	* This function retrieves the x position of an object.
	* 
	* @property xAccessor
	* @type {Function}
	* @default function (p) { return p.x; };
	*/
	QuadTree.prototype.xAccessor = function (p) { return p.x; };
	
	/**
	* This function retrieves the y position of an object.
	* 
	* @property yAccessor
	* @type {Function}
	* @default function (p) { return p.y; };
	*/
	QuadTree.prototype.yAccessor = function (p) { return p.y; };
	
	/**
	* The maximum number of points in a leaf node
	* 
	* @property threshold
	* @type {Number}
	* @default 8
	*/
	QuadTree.prototype.upperThreshold = 8;
	
	/**
	* If a parent nodes total number of contained points falls below this number, 
	* it will merge all subtrees and become a leaf node.
	* 
	* @property threshold
	* @type {Number}
	* @default 4
	*/
	QuadTree.prototype.lowerThreshold = 4;
	
	/**
	* Total number of points contained within this QuadTree
	* 
	* @property pointCount
	* @type {Number}
	* @private
	* @default 0
	*/
	QuadTree.prototype.pointCount = 0;
	
	/**
	* The maximum depth of the QuadTree.
	* 
	* @property maxDepth
	* @type {Number}
	* @private
	* @default 6
	*/
	QuadTree.prototype.maxDepth = 16;
	
	//Private functions
	
	/**
	* This function places a point in the correct subtree.
	* 
	* @method distributePoint
	* @param {Object} A point object to place in one of the subtrees.
	* @private
	*/
	function distributePoint(point)
	{
		var pointX = this.xAccessor(point),
		    pointY = this.yAccessor(point);
		
		if (!this.contains(pointX, pointY))
		{
			throw new Error("Point is out of bounds of the QuadTree");
		}
			
		if (pointX < this.topLeft.maxX)
		{
			if (pointY < this.topLeft.maxY)
			{
				this.topLeft.add(point);
			}
			else
			{
				this.bottomLeft.add(point);
			}
		}
		else
		{
			if (pointY < this.topLeft.maxY)
			{
				this.topRight.add(point);
			}
			else
			{
				this.bottomRight.add(point);
			}
		}
	}

	/**
	* This function decides if the QuadTree should be sub-divided.
	*
	* Even if the quadtree has more points in a leaf node than the upperThreshold,
	* there is no point subdividing if all the nodes will then fall within
	* 
	* @method shouldSubdivide
	* @private
	* @return {Boolean} If a subdivision should be performed.
	*/
	function shouldSubdivide()
	{
		if (this.points.length <= this.upperThreshold)
			return false; //No point subdividing if we don't have enough points
			
		if (this.minX === this.maxX && this.minY === this.maxY)
		{
			//No point subdividing if we are just one point.
			return false;
		}
		
		if (this.maxDepth <= 1)
		{
			//Cant subdivide if this must be a leaf node!
			return false;
		}
		
		return true;
	}

	/**
	* This function splits a leaf node into 4 subtrees.
	* 
	* @method subdivide
	* @private
	*/
	function subdivide()
	{
		if (this.points === null)
		{
			throw new Error("Cannot subdivide a QuadTree that is not a leaf node");
		}
		
		var myself = this;
		
		var maxX = this.maxX,
			minX = this.minX,
		    maxY = this.maxY,
			minY = this.minY;
			
		var midX = (minX + maxX) / 2;
		var midY = (minY + maxY) / 2;
		
		var config = {
			xAccessor: this.xAccessor, 
			yAccessor: this.yAccessor,
			upperThreshold: this.upperThreshold,
			lowerThreshold: this.lowerThreshold,
			maxDepth: this.maxDepth - 1,
		};
		
		//Make the new nodes
		this.topLeft = new QuadTree(minX, minY, midX, midY, config);
		this.topRight = new QuadTree(midX, minY, maxX, midY, config);
		this.bottomLeft = new QuadTree(minX, midY, midX, maxY, config);
		this.bottomRight = new QuadTree(midX, midY, maxX, maxY, config);

		//Add all the points
		this.points.forEach(function (point)
		{
			distributePoint.call(myself, point);
		});
		
		//We are no longer a leaf node, clear the points out.
		this.points = null;
	}

	/**
	* This function merges all the points in 4 leaf nodes. 
	*
	* This node must be a parent to leaf nodes only.
	* 
	* @method merge
	* @private
	*/
	function merge()
	{
		if (this.points !== null)
		{
			throw new Error("Cannot merge a QuadTree that is a leaf node");
		}
		
		function addAllPoints(pointsArray, quadTreeNode) {
			if (quadTreeNode.points === null)
				throw new Error("Child node is not a leaf node");
			
			pointsArray.concat(quadTreeNode.points);
		}
		
		this.points = [];
		
		addAllPoints(this.points, this.topLeft);
		addAllPoints(this.points, this.topRight);
		addAllPoints(this.points, this.bottomLeft);
		addAllPoints(this.points, this.bottomRight);
		
		this.topLeft = null;
		this.topRight = null;
		this.bottomLeft = null;
		this.bottomRight = null;
	}
	
	// Member functions

	/**
	* Adds a point to the QuadTree
	* 
	* @method add
	* @param {Object} point The point to add to the QuadTree
	*/
	QuadTree.prototype.add = function (point)
	{
		//Point added.
		this.pointCount++;
		
		if (this.points === null)
		{
			//Not a leaf node
			distributePoint.call(this, point);
		}
		else
		{
			//Leaf node
			this.points.push(point);

			//Split up if we have too many points
			if (shouldSubdivide.call(this))
			{
				subdivide.call(this);
			}
		}
	}
	
	/**
	* Removes a point from the QuadTree
	* 
	* @method remove
	* @param {Object} point The point to remove from the QuadTree
	* @return {Boolean} True on success.
	*/
	QuadTree.prototype.remove = function (point)
	{
		//Cannot possibly have the object if it isn't in our boundaries!
		if (!this.contains(point))
		{
			return false;
		}
		
		if (this.points === null)
		{
			//Remove the object
			var removed =
				this.topLeft.remove(point) || 
				this.topRight.remove(point) || 
				this.bottomLeft.remove(point) || 
				this.bottomRight.remove(point);
			
			//Were we successful?
			if (removed)
			{
				this.pointCount--;
				
				if (this.pointCount < this.lowerThreshold)
				{
					merge.call(this);
				}
			}
			
			return removed;
		}
		else
		{
			for (var i=0; i<this.points.length; i++)
			{
				if (this.points[i] === point)
				{
					this.points.splice(i,1);
					return true;
				}
			}
			return false;
		}
	}
	
	function squareDistance(x1, y1, x2, y2)
	{
		var dx = x1 - x2, 
		    dy = y1 - y2;
			
		return dx * dx + dy * dy;
	}
	
	/**
	* Gets the nearest points to an arbitrary point P
	* 
	* @method nearestPoint
	* @param {Number} x X coordinate of P
	* @param {Number} y Y coordinate of P
	* @return {Object}
	*         sqDistance: Square distance to nearest point object(s) to P.
	*         points:     Array of all points exactly sqDistance away from P.
	*/
	QuadTree.prototype.nearestPoint = function (x, y)
	{
		function nearestPointPrivate(x, y, currentBest)
		{
			if (this.points !== null)
			{
				// Leaf node! Search my points!
				// No points case
				if (this.points.length == 0)
				{
					return; // Nothing in this subtree, result does not change
				}

				// 1 or more points...
				for (var i = 0; i < this.points.length; i++)
				{
					var pointX = this.xAccessor(this.points[i]),
					    pointY = this.yAccessor(this.points[i]);
					
					var sd = squareDistance(x, y, pointX, pointY);

					if (sd < currentBest.sqDistance)
					{
						// If the distance to this point is less than the current best, 
						// clear the set of closest points and add this one
						currentBest.points.length = 0;
						currentBest.points.push(this.points[i]);

						currentBest.sqDistance = sd;
					}
					else if (sd == currentBest.sqDistance)
					{
						// If the distance to this point is the same as the current best, add it to 
						// the set of closest points 
						currentBest.points.push(this.points[i]);
					}
				}
				
				currentBest.hits += this.points.length;
			}
			else
			{
				var midX = (this.minX + this.maxX) / 2;
				var midY = (this.minY + this.maxY) / 2;

				var dx = midX - x;
				var dy = midY - y;

				dx *= dx;
				dy *= dy;

				if (y < midY)
				{
					if (x < midX)
					{
						//Try Top-Left
						nearestPointPrivate.call(this.topLeft, x, y, currentBest);

						//Do we go into the topRight box?
						if (currentBest.sqDistance >= dx)
							nearestPointPrivate.call(this.topRight, x, y, currentBest);

						//Do we go into the bottomLeft box?
						if (currentBest.sqDistance >= dy)
							nearestPointPrivate.call(this.bottomLeft, x, y, currentBest);

						//Otherwise, do we go into the bottomRight?
						if (currentBest.sqDistance >= dx + dy)
							nearestPointPrivate.call(this.bottomRight, x, y, currentBest);
					}
					else
					{
						//Try Top-Right
						nearestPointPrivate.call(this.topRight, x, y, currentBest);
						
						//Do we go into the topLeft box?
						if (currentBest.sqDistance >= dx)
							nearestPointPrivate.call(this.topLeft, x, y, currentBest);

						//Do we go into the bottomRight box?
						if (currentBest.sqDistance >= dy)
							nearestPointPrivate.call(this.bottomRight, x, y, currentBest);

						//Otherwise, do we go into the bottomLeft?
						if (currentBest.sqDistance >= dx + dy)
							nearestPointPrivate.call(this.bottomLeft, x, y, currentBest);
					}
				}
				else
				{
					if (x < midX)
					{
						//Try Bottom-Left
						nearestPointPrivate.call(this.bottomLeft, x, y, currentBest);

						//Do we go into the bottomRight box?
						if (currentBest.sqDistance >= dx)
							nearestPointPrivate.call(this.bottomRight, x, y, currentBest);

						//Do we go into the topLeft box?
						if (currentBest.sqDistance >= dy)
							nearestPointPrivate.call(this.topLeft, x, y, currentBest);

						//Otherwise, do we go into the topRight?
						if (currentBest.sqDistance >= dx + dy)
							nearestPointPrivate.call(this.topRight, x, y, currentBest);
					}
					else
					{
						//Try Bottom-Right
						nearestPointPrivate.call(this.bottomRight, x, y, currentBest);

						//Do we go into the bottomLeft box?
						if (currentBest.sqDistance >= dx)
							nearestPointPrivate.call(this.bottomLeft, x, y, currentBest);

						//Do we go into the topRight box?
						if (currentBest.sqDistance >= dy)
							nearestPointPrivate.call(this.topRight, x, y, currentBest);

						//Otherwise, do we go into the topLeft?
						if (currentBest.sqDistance >= dx + dy)
							nearestPointPrivate.call(this.topLeft, x, y, currentBest);
					}
				}
			}
		}

		var initial = {
			sqDistance: Number.MAX_VALUE,
			points: [],
			hits: 0
		}
		nearestPointPrivate.call(this, x, y, initial);
		return initial;
	}
	
	/**
	* Checks if a point is inside this QuadTree
	* 
	* @method contains
	* @param {Number|Object} pointOrX The point to remove from the QuadTree
	* @param {Number} [y]
    *        The y position of the point. If undefined, pointOrX is a point object. If defined, 
	*        pointOrX must be a Number
	* @return {Boolean} True if the point is inside
	*/
	QuadTree.prototype.contains = function (pointOrX, y)
	{
		var pointX, pointY;
		
		if (y === undefined)
		{
			pointX = this.xAccessor(pointOrX);
			pointY = this.yAccessor(pointOrX);
		}
		else
		{
			if (typeof pointOrX !== "number")
				throw new TypeError("If y is defined, pointOrX must be a number");
			pointX = pointOrX;
			pointY = y;
		}
		
		return (pointX >= this.minX
		    && pointX < this.maxX
			&& pointY >= this.minY
			&& pointY < this.maxY);
	}
	
	return QuadTree;
}();