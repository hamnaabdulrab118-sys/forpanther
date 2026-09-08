/*

    Algorithmic Tree - 1.0.0
    drawing trees algorithmically on the HTML5 canvas

    License       : GPL
    Developer     : Sameer Borate: http://codediesel.com
    Web Site      : http://codediesel.com

 */

var tree = {

    canvas:     '',
    ctx:        '',
    height:     0,
    width:      0,
    spread:     0.2,
    drawLeaves: true,
    leaveType:  this.MEDIUM_LEAVES,
    
    MAX_BRANCH_WIDTH:   10,
    SMALL_LEAVES:       10,
    MEDIUM_LEAVES:      200,
    BIG_LEAVES:         500,
    THIN_LEAVES:        900,
    automnColors: ['#996655', '#cc6633', '#cc8844', '#cc8866', '#ff8833', '#ffbb55'],
    branchColor: '#3F3F3F',
    leavesColor: '',

    /**
     * @member draw
     * tree.draw() initializes the tree structure
     *
     * @param {object} ctx      the canvas context
     * @param {integer} h       height of the canvas
     * @param {integer} w       width of the canvas
     * @param {float} spread    how much the tree branches are spread
     *                          Ranges from 0.3 - 1.
     * @param {boolean} leaves  draw leaves if set to true    
     *
     */
    draw : function(ctx, h, w, spread, leaves, leaveType, index, treeHeight) {
        this.leavesColor = this.automnColors[Math.floor(Math.random() * this.automnColors.length)];
        // Set how much the tree branches are spread
        if(spread >= 0.3 && spread <= 1) {
            this.spread = spread;
        } else {
            this.spread = 0.6;
        }
        
        if(leaves === true || leaves === false) {
            this.drawLeaves = leaves;
        } else {
            this.leaves = true;
        }
        
        if(leaveType == this.SMALL_LEAVES || 
           leaveType == this.MEDIUM_LEAVES || 
           leaveType == this.BIG_LEAVES || 
           leaveType == this.THIN_LEAVES) {
            this.leaveType = leaveType;
        } else {
            this.leaveType = this.MEDIUM_LEAVES;
        }
        
        this.ctx = ctx;
        this.height = h;
        this.width = w;
        //this.ctx.clearRect(0,0,this.width,this.height);
        var gradient = this.ctx.createLinearGradient(0, height, 0, 0)
        gradient.addColorStop(0,"rgba(255,255,255,0.01)");
        gradient.addColorStop(1,"rgba(255,255,255,0)");
        //this.ctx.fillStyle = 'rgba(255,255,255,0.01)';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        // Center the tree in the window
        this.ctx.translate(index*this.width/treeNumbers - (Math.random()*100 - Math.random()*100) ,this.height);
        // Set the leaves to a random color
        this.leavesColor = this.leavesColor;
        // Set branch thickness
        this.ctx.lineWidth = 1 + (Math.random() * this.MAX_BRANCH_WIDTH);
        this.ctx.lineJoin = 'round';
        
        this.branch(0, treeHeight);
    },
    
    /**
     * @member branch
     * tree.branch() main tree drawing function
     *
     * @param {String} depth the maimum depth the tree can branch,
     *        Keep this value near 12, larger value take linger to render.
     *
     */
    branch : function(depth, treeHeight) {
        if (depth < 12) 
        {
            this.ctx.beginPath();
            this.ctx.moveTo(0,0);
            this.ctx.lineTo(0,-(this.height)/treeHeight);

            this.ctx.strokeStyle = this.branchColor;
            this.ctx.stroke();
            
            this.ctx.translate(0,-this.height/treeHeight);
            // Random integer from -0.1 to 0.1
            var randomN = -(Math.random() * 0.1) + 0.1;

            this.ctx.rotate(randomN); 

            if ((Math.random() * 1) < this.spread)
            {
                // Draw the left branches
                //this.ctx.rotate((Math.floor(Math.random() * 45) + 25)*0.001);
                var rotateLeft = (Math.random()*(4-3+1)+3)*0.1;
                var rotateRight = (Math.random()*(7-6+1)+6)*0.1;
                this.ctx.rotate(-rotateLeft);
                //var scaling = (Math.random()*(7-5+1)+5)*0.1;
                this.ctx.scale(0.7, 0.7);
                this.ctx.save();
                this.branch(depth + 1, treeHeight);
                // Draw the right branches
                this.ctx.restore();  
                this.ctx.rotate(rotateRight);
                this.ctx.save();
                this.branch(depth + 1, treeHeight);   
                this.ctx.restore();        
            }
            else 
            { 
                this.branch(depth, treeHeight);
            }

        }
        else
        {   
            // Now that we have done drawing branches, draw the leaves
            if(this.drawLeaves) {
                var lengthFactor = 200;
                if(this.leaveType === this.THIN_LEAVES) {
                    lengthFactor = 10;
                }
                this.ctx.fillStyle = this.leavesColor;
                this.ctx.fillRect(0, 0, this.leaveType, lengthFactor);
                this.ctx.stroke();
            }
        }
    }
};




var width = window.innerWidth;  
var height = window.innerHeight;
var intervalId = 0;
var treeNumbers = 10;
var trees = [];

var drawLeaves = true;
var treeSpread = Math.random()*10; // 0.6
var temp  = Math.round(Math.random()*10); // 2
var leaveType = '';

switch(temp) {
    case '1': leaveType = tree.SMALL_LEAVES;
            break;
    case '2': leaveType = tree.MEDIUM_LEAVES;
            break;
    case '3': leaveType = tree.BIG_LEAVES;
            break;
    case '4': leaveType = tree.THIN_LEAVES;
            break;
    default:leaveType = tree.MEDIUM_LEAVES;
}


function init() {
    
    var canvas = document.getElementById("canvas");
    
    if(canvas.getContext("2d")) {
    
        canvas.height = height;
        canvas.width = width;
        ctx = canvas.getContext("2d");
        for(var i=0;i<treeNumbers;i++){
            drawTree(i);
        }
    
    } else {
        document.getElementsByTagName('body').innerHTML = "Your browser doen't support Canvas!";
    }

    animate();
};

function drawTree(i) {
    ctx.save();
    tree.draw(ctx,height,width,treeSpread,drawLeaves,leaveType, i, 10);
    ctx.restore();
}


function animate(){
    ctx.save();
    // Math.round((Math.random()*(500-5+1)+5))
    tree.draw(ctx,height,width,treeSpread,drawLeaves,leaveType, Math.round((Math.random()*(treeNumbers+1))), Math.round((Math.random()*(15-5+1)+5)));
    ctx.restore();
}

document.body.onkeydown = function(e){
    animate();
}

init();