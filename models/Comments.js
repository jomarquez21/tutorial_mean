var mongoose = require('mongoose');

/* Schema
 *
 *
 */

var CommentSchema = new mongoose.Schema({
    body: String,
    author: String,
    upvotes: {type: Number, default: 0},
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post'}
});

/* Methods
 *
 *
 */

CommentSchema.methods.upvote = function(cb) {
    this.upvotes += 1;
    this.save(cb);
}

/* Model
 *
 *
 */

mongoose.model('Comment', CommentSchema);
