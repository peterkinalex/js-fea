/*global require*/
// field

var _ = require('./core.utils');
var check = _.check;
var assert = _.assert;
var array2d = _.array2d;
var array1d = _.array1d;
var defineContract = _.defineContract;
var matrixOfDimension = _.contracts.matrixOfDimension;
var PointSet = require('./geometry.pointset').PointSet;
var FeNodeSet = require('./fens').FeNodeSet;

var _input_contract_field_option_ = defineContract(function(o) {
  assert.object(o);
  if (check.assigned(o.values)) {
    matrixOfDimension('*', '*', 'values is not a valid matrix.')(o.values);
  } else if (check.assigned(o.nfens) && check.assigned(o.dim)) {
    assert.integer(o.nfens);
    assert.integer(o.dim);
    if (o.nfens < 0) throw new Error('nfens must > 0.');
    if (o.dim < 0) throw new Error('dim must > 0');
  } else if (check.assigned(o.fens)) {
    assert.instance(o.fens, FeNodeSet);
  } else if (check.assigned(o.pointset)) {
    assert.instance(o.pointset, PointSet);
  } else {
    throw new Error('');
  }

  if (check.assigned(o.ebcs)) {
    assert.array(o.ebcs, 'ebcs must be a array of valid EBC object');
  }

}, 'Input is not a valid Field option.');

function Field(options) {
  _input_contract_field_option_(options);

  if (check.assigned(options.values)) {
    this._values = new PointSet(options.values);
  } else if (check.assigned(options.pointset)) {
    this._values = options.pointset.clone();
  } else if (check.assigned(options.fens)) {
    this._values = new PointSet(options.fens.xyz());
  } else if (check.assigned(options.nfens) && check.assigned(options.dim)) {
    this._values = new PointSet(options.nfens, options.dim);
  }

  if (check.assigned(options.ebcs)) {
    // TODO: merge ebcs
    // +1 because the id and direction index starts from 1;
    var prescribed = array2d(this.nfens() + 1, this.dim() + 1, false);
    var prescribedValues =  array2d(this.nfens() + 1, this.dim() + 1, 0);
    options.ebcs.forEach(function(ebc) {
      // TODO: make sure ebc object is valid;
      ebc.fenids.forEach(function(fenid, i) {
        var comp = ebc.component[i];
        prescribed[fenid][comp] = !!(ebc.prescribed[i]);
        prescribedValues[fenid][comp] = ebc.value[i];
      });
    });
    this._prescribed = prescribed;
    this._prescribedValues = prescribedValues;
  }

  this._eqnums = null;
  this._neqns = -1;
}

Field.prototype.nfens = function() {
  return this._values.getSize();
};

Field.prototype.neqns = function() {
  if (!this._eqnums) this._numberEqnums_();
  return this._neqns;
};

Field.prototype.dim = function() {
  return this._values.getRn();
};

Field.prototype.isPrescribed = function(id, direction) {
  if (!this._prescribed) return false;
  return this._prescribed[id][direction];
};

Field.prototype.prescribedValue = function(id, direction) {
  if (this.isPrescribed(id, direction))
    return this._prescribedValues[id][direction];
  return null;
};

Field.prototype._numberEqnums_ = function() {
  var eqnums = array2d(this.nfens() + 1, this.dim() + 1, 0);

  var count = 0, nfens = this.nfens(), dim = this.dim();
  var i, j;
  for (i = 1; i <= nfens; ++i) {
    for (j = 1; j <= dim; ++j) {
      if (!this.isPrescribed(i, j)) {
        count++;
        eqnums[i][j] = count;
      } else {
        eqnums[i][j] = 0;
      }
    }
  }
  this._eqnums = eqnums;
  this._neqns = count;
};

Field.prototype.eqnum = function(id, direction) {
  if (!this._eqnums) this._numberEqnums_();
  if (id < 1 || id > this.nfens()) throw new Error('Field::eqnum(): id out of range.');
  if (direction < 1 || direction > this.dim()) throw new Error('Field::eqnum(): direction out of range.');
  return this._eqnums[id][direction];
};

Field.prototype.gatherEqnumsVector = function(conn) {
  var vec = [], dim = this.dim();
  conn.forEach(function(fenid) {
    var i, eqnum;
    for (i = 1; i <= dim; ++i) {
      vec.push(this.eqnum(fenid, i));
    }
  }, this);
  return vec;
};

Field.prototype.gatherValuesMatrix = function(conn) {
  var len = conn.length, dim = this.dim();
  var mat = array1d(len, null);
  conn.forEach(function(fenid, i) {
    var idx = fenid - 1;
    mat[i] = this._values.get(idx);
  }, this);
  return mat;
};

exports.Field = Field;
