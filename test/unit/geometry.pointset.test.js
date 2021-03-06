/*global __dirname describe it require*/
var ROOT = __dirname + '/../..', SRC = ROOT + '/src';
var expect = require('expect.js');
var _ = require(SRC + '/core.utils.js');
var numeric = require(SRC + '/core.numeric');
var norm2 = numeric.norm2;
var sub = numeric.sub;
var PointSet = require(SRC + '/geometry.pointset.js').PointSet;

describe('geometry.pointset.js', function() {
  describe('PointSet::constructor()', function() {
    it('([]) should throw because can not determin rn', function() {
      var fn = function(x) { return new PointSet(x); }.bind(null, []);
      expect(fn).to.throwException();
    });

    it('([], rn) should return empty pointset of dimension rn', function() {
      var ps = new PointSet([], 3);
      expect(ps.size).to.be(0);
      expect(ps.rn).to.be(3);
    });

    it('([[]]) should return a pointset contains one 0-d point', function() {
      var ps = new PointSet([[]]);
      expect(ps.size).to.be(1); expect(ps.rn).to.be(0);
    });

    it('([coords1, coords2, ...])', function() {
      var ps = new PointSet([
        [0],
        [1, 2, 3],
        [2, 0],
        [2]
      ]);
      expect(ps.size).to.be(4);
      expect(ps.rn).to.be(3);
      expect(ps.toList()).to.eql([
        [0, 0, 0],
        [1, 2, 3],
        [2, 0, 0],
        [2, 0, 0]
      ]);
    });

    it('(size, rn)', function() {
      var ps = new PointSet(3, 2);
      expect(ps.size).to.be(3);
      expect(ps.rn).to.be(2);
      expect(ps.toList()).to.eql([
        [0, 0],
        [0, 0],
        [0, 0]
      ]);
    });

    it('(size, fn)', function() {
      var ps = new PointSet(3, function(idx) { return [idx+1, idx-1]; });
      expect(ps.size).to.be(3);
      expect(ps.rn).to.be(2);
      expect(ps.toList()).to.eql([
        [1, -1],
        [2, 0],
        [3, 1]
      ]);
    });

  });

  describe('PointSet::get(index)', function() {
    var ps = new PointSet([[1,2], [2,4,0]]);
    it('should throw error if the index out of bounds', function() {
      expect(ps.get.bind(ps, -1)).to.throwException();
      expect(ps.get.bind(ps, 2)).to.throwException();
    });

    it('should return an array of rn numbers', function() {
      var point0 = ps.get(0);
      expect(point0.length).to.be(ps.rn);
      expect(point0).to.eql([1, 2, 0]);
    });

    it('should return a copy of coords instead of reference.', function() {
      var point1 = ps.get(1);
      point1[0] = 100; point1[1] = 100; point1[2] = 100;

      var point1Again = ps.get(1);
      expect(point1Again).to.eql([2, 4, 0]);
    });
  });


  describe('PointSet::set_(index, point)', function() {
    var ps = new PointSet([[1,2], [2,4,0]]);
    it('should throw error if the index out of bounds', function() {
      expect(ps.set_.bind(ps, -1, [3,3,4])).to.throwException();
      expect(ps.set_.bind(ps, 2, [3,3,3])).to.throwException();
    });

    it('should throw error if the point dimension is not matched', function() {
      expect(ps.set_.bind(ps, 0, [3,3])).to.throwException();
      expect(ps.set_.bind(ps, 0, [])).to.throwException();
    });

    it('should set the coords', function() {
      ps.set_(0, [5, 5, 5]);

      var point0 = ps.get(0);
      expect(point0.length).to.be(ps.rn);
      expect(point0).to.eql([5, 5, 5]);
    });
  });

  describe('PointSet::clone()', function() {
    var ps1, ps2;
    it('should clone', function() {
      ps1 = new PointSet([[1, 2], [3, 4, 5]]);
      ps2 = ps1.clone();
    });

    it('should work with empty pointset', function() {
      var emptySet = new PointSet([], 2);
      expect(emptySet.clone().equals(emptySet)).to.be(true);
    });

    it('should clone be the same', function() {
      expect(ps1.equals(ps2)).to.be(true);
    });

    it('should not reference same object', function() {
      ps1.set_(0, [5, 5, 5]);
      expect(ps1.get(0)).to.eql([5, 5, 5]);
      expect(ps2.get(0)).to.eql([1, 2, 0]);
    });
  });

  describe('PointSet::equals(other)', function() {
    it('should equal', function() {
      var ps1 = new PointSet([[1, 2], [3, 4, 5]]);
      var ps2 = new PointSet([[1, 2, 0], [3, 4, 5]]);
      expect(ps1.equals(ps2)).to.be(true);

      var ps3 = new PointSet([[]]);
      var ps4 = new PointSet([[]]);
      expect(ps3.equals(ps4)).to.be(true);
    });

    it('should not equal', function() {
      var ps1 = new PointSet([[1, 2], [3, 4, 5]]);
      var ps2 = new PointSet([[1, 2, 4], [3, 4, 5]]);
      expect(ps1.equals(ps2)).to.be(false);

      var ps3 = new PointSet([[1, 2]]);
      var ps4 = new PointSet([[1, 2, 0]]);
      expect(ps3.equals(ps4)).to.be(false);
    });
  });

  describe('PointSet::forEach(iterator)', function() {
    it('should do nothing if point set is empty', function() {
      var ps = new PointSet([], 1), called = false;
      ps.forEach(function(p, i) { called = true; });
      expect(called).to.be(false);
    });

    var lst, ps;
    it('should iterate over all points', function() {
      lst = [], ps = new PointSet([[0, 1], [1], [3, 3, 5]]);
      ps.forEach(function(p, i) {
        lst.push({ index: i, point: p });
      });
      expect(lst).to.eql([
        {index: 0, point: [0, 1, 0]},
        {index: 1, point: [1, 0, 0]},
        {index: 2, point: [3, 3, 5]}
      ]);
    });

    it('should point be copy not reference', function() {
      lst[0].point[0] = 5, lst[0].point[1] = 5, lst[0].point[2] = 5;
      expect(ps.get(0)).to.eql([0, 1, 0]);
    });
  });

  describe('PointSet::map(transform)', function() {
    var ps1 = new PointSet([[1], [2, 3], [4, 5, 6]]);
    var ps2 = ps1.map(function(p, i) {
      return p.map(function(x) { return x*2; });
    });

    it('should return a correct pointset', function() {
      expect(ps2.toList()).to.eql([
        [2, 0, 0],
        [4, 6, 0],
        [8, 10, 12]
      ]);
    });

    it('should return copy not reference', function() {
      ps2.set_(0, [7, 7, 8]);
      expect(ps1.get(0)).to.eql([1, 0, 0]);
    });
  });

  describe('PointSet::filter(predicate)', function() {
    var ps = new PointSet([
      [0, 0, 0],
      [1, 1, 1],
      [2, 2, 2]
    ]);
    var ps1 = new PointSet([[0, 0, 0]]);
    var ps2 = new PointSet([[1, 1, 1]]);

    it('should return empty pointset of same rn', function() {
      var emptyPs = ps.filter(function() { return false; });
      expect(emptyPs.getSize()).to.be(0);
      expect(emptyPs.getRn()).to.be(3);
    });

    it('should return correct pointset', function() {
      var p1 = function(p) {
        return p[0] < 0.5 && p[1] < 0.5 && p[2] < 0.5;
      };
      var p2 = function(p, i) { return i === 1; };
      expect(ps.filter(p1).equals(ps1)).to.be(true);
      expect(ps.filter(p2).equals(ps2)).to.be(true);
    });

    it('should not mutate original pointset', function() {
      expect(ps.toList()).to.eql([
        [0, 0, 0],
        [1, 1, 1],
        [2, 2, 2]
      ]);
    });
  });

  describe('PointSet::embed(dim)', function() {
    it('should work for higher dimension', function() {
      var ps1 = new PointSet([[1], [2, 3]]);
      var ps2 = ps1.embed(3);
      expect(ps1.toList()).to.eql([
        [1, 0],
        [2, 3]
      ]);
      expect(ps2.toList()).to.eql([
        [1, 0, 0],
        [2, 3, 0]
      ]);

    });

    it('should work for lower dimension', function() {
      var ps1 = new PointSet([[1], [2, 3]]);
      var ps2 = ps1.embed(1);
      expect(ps1.toList()).to.eql([
        [1, 0],
        [2, 3]
      ]);
      expect(ps2.toList()).to.eql([
        [1],
        [2]
      ]);
    });
  });

  describe('PointSet::extrude(hlist)', function() {
    var p = new PointSet([[]]), lineSeg, rect, cube;
    it('should extrude 0-d point to a line segment', function() {
      lineSeg = p.extrude([1]);
      expect(lineSeg.toList()).to.eql([
        [0],
        [1]
      ]);
    });

    it('should extrude line segment to rect', function() {
      rect = lineSeg.extrude([1]);
      expect(rect.toList()).to.eql([
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1]
      ]);
    });

    it('should extrude rect to cube', function() {
      cube = rect.extrude([1, 1]);
      expect(cube.toList()).to.eql([
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [1, 1, 0],

        [0, 0, 1],
        [1, 0, 1],
        [0, 1, 1],
        [1, 1, 1],

        [0, 0, 2],
        [1, 0, 2],
        [0, 1, 2],
        [1, 1, 2]
      ]);
    });
  });

  describe('PointSet::findOne(predicate)', function() {
    it('should work with empty set', function() {
      var ps = new PointSet([], 2);
      var p = function() { return true; };
      expect(ps.findOne(p)).to.be(null);
    });

    it('should work with non-empty set', function() {
      var ps = new PointSet([[1, 0], [2, 3]], 2);
      var p1 = function(p, i) {
        var d = norm2(sub(p, [2, 2.9]));
        return d < 0.5;
      };
      var p2 = function(p, i) { return norm2(p, [12, 2.9]) < 0.5; };
      expect(ps.findOne(p1)).to.eql([2, 3]);
      expect(ps.findOne(p2)).to.be(null);
    });
  });

  describe('PointSet::contains(point, precision)', function() {
    it('should work with empty set', function() {
      var ps = new PointSet([], 2);
      expect(ps.contains([0, 0], 1e-6)).to.be(false);
    });

    it('should work with point of different dimension', function() {
      var ps = new PointSet([[1, 0], [2, 3]], 2);
      expect(ps.contains([1], 1e-6)).to.be(false);
      expect(ps.contains([2, 3, 0], 1e-6)).to.be(false);
    });

    it('should work with point of same dimension', function() {
      var ps = new PointSet([[1, 0], [2, 3]], 2);
      expect(ps.contains([1, 0], 1e-6)).to.be(true);
      expect(ps.contains([2, 3], 1e-6)).to.be(true);
      expect(ps.contains([2.1, 3.1], 1e-6)).to.be(false);
      expect(ps.contains([2.1, 3.1], 0.2)).to.be(true);
    });
  });

  describe('PointSet::merged(precision)', function() {
    it('should work with empty pointset', function() {
      var ps = new PointSet([], 2);
      expect(ps.merged(1e-5).equals(ps)).to.be(true);
    });

    it('should work with non-empty pointset', function() {
      var ps = new PointSet([
        [1e-8, 1e-8],
        [2e-8, 2e-8],
        [3e-8, 3e-8],
        [2, 2],
        [3, 3, 4]
      ]);
      expect(ps.merged(1e-6).getSize()).to.be(3);
      expect(ps.getSize()).to.be(5);
    });
  });

  describe('PointSet::combineWith(other)', function() {
    it('should throw if two pointset dimension dismatch', function() {
      var ps1 = new PointSet([[1]]);
      var ps2 = new PointSet([[1], [2, 3]]);
      expect(ps1.combineWith.bind(ps1, ps2)).to.throwException();
    });

    it('should work with empty pointset', function() {
      var ps1 = new PointSet([], 2);
      var ps2 = new PointSet([[1, 2]]);
      expect(ps1.combineWith(ps1.clone()).equals(ps1)).to.be(true);
      expect(ps1.combineWith(ps2).toList()).to.eql(ps2.toList());
      expect(ps1.getSize()).to.be(0);
    });

    it('should work with non-empty pointset', function() {
      var ps1 = new PointSet([
        [1, 1],
        [2, 2],
        [3, 3]
      ]);
      var ps2 = new PointSet([
        [4, 4],
        [5, 5]
      ]);
      expect(ps1.combineWith(ps2).toList()).to.eql([
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [5, 5]
      ]);
      expect(ps1.getSize()).to.be(3);
    });
  });

  describe('PointSet::translate(dims, values)', function() {
    it('should throw if dims and values not valid', function() {
      var ps = new PointSet([[1, 2], [3]]);
      expect(ps.translate.bind(ps, 0, 5)).to.throwException();
      expect(ps.translate.bind(ps, [0, 1], 5)).to.throwException();
      expect(ps.translate.bind(ps, [0, 1], [5])).to.throwException();
      expect(ps.translate.bind(ps, [0, 1, 2], [5, 5, 5])).to.throwException();
    });

    it('should translate points', function() {
      var ps = new PointSet([[1, 2], [3]]);
      expect(ps.translate([0], [0.5]).toList()).to.eql([
        [1.5, 2],
        [3.5, 0]
      ]);
      expect(ps.translate([0, 1], [1, -1]).toList()).to.eql([
        [2, 1],
        [4, -1]
      ]);
    });
  });

  describe('PointSet::scale(dims, values)', function() {
    it('should throw if dims and values not valid', function() {
      var ps = new PointSet([[1, 2], [3]]);
      expect(ps.scale.bind(ps, 0, 5)).to.throwException();
      expect(ps.scale.bind(ps, [0, 1], 5)).to.throwException();
      expect(ps.scale.bind(ps, [0, 1], [5])).to.throwException();
      expect(ps.scale.bind(ps, [0, 1, 2], [5, 5, 5])).to.throwException();
    });

    it('should scale points', function() {
      var ps = new PointSet([[1, 2], [3]]);
      expect(ps.scale([0], [0.5]).toList()).to.eql([
        [0.5, 2],
        [1.5, 0]
      ]);
      expect(ps.scale([0, 1], [2, -1]).toList()).to.eql([
        [2, -2],
        [6, 0]
      ]);
    });
  });
});
