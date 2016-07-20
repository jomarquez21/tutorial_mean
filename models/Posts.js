var mongoose = require('mongoose');

/* Schema
 *
 *
 */

var PostSchema = new mongoose.Schema({
    title: String,
    link: String,
    author: String,
    // author: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User'
    // },
    upvotes: {
        type: Number,
        default: 0
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
});

/* Methods
 *
 *
 */

PostSchema.methods.upvote = function(cb) {
    this.upvotes += 1;
    this.save(cb);
}

/* Model
 *
 *
 */

mongoose.model('Post', PostSchema);