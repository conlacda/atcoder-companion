class RangeColor {
    static rangeColors = {
        '0-399': '<span class="user-gray" style="font-weight: bold">{}</span>',
        '400-799': '<span class="user-brown" style="font-weight: bold">{}</span>',
        '800-1199': '<span class="user-green" style="font-weight: bold">{}</span>',
        '1200-1599': '<span class="user-cyan" style="font-weight: bold">{}</span>',
        '1600-1999': '<span class="user-blue" style="font-weight: bold">{}</span>',
        '2000-2399': '<span class="user-yellow" style="font-weight: bold">{}</span>',
        '2400-2799': '<span class="user-orange" style="font-weight: bold">{}</span>',
        '2800-10000': '<span class="user-red" style="font-weight: bold">{}</span>',
        'default': '<span>{}</span>',
    }

    // Get color for an arbitraty rating
    static getColor(rating) {
        for (const [key, value] of Object.entries(this.rangeColors)) {
            const [_min, _max] = key.split('-');
            if (parseInt(_min) <= rating && rating <= parseInt(_max)) {
                return value.replace('{}', rating);
            }
        }
        return this.rangeColors.default.replace('{}', rating);
    }
}

const diff = {
    UP: '<span style="font-weight: bold; color: green">+{}</span>',
    DOWN: '<span style="font-weight: bold; color: gray">{}</span>',
    ZERO: '<span class="user-gray" style="font-weight: bold">±0</span>',
}

class Color {
    // return html for performance of num
    static performance(num) {
        return RangeColor.getColor(num);
    }

    static diff(num) {
        if (num == 0) return diff.ZERO;
        if (num > 0) return diff.UP.replace('{}', num);
        if (num < 0) return diff.DOWN.replace('{}', num);
    }

    static colorChange(oldRating, newRating) {
        const diff = newRating - oldRating;
        if (diff === 0) {
            return '-';
        }
        if (diff > 0) {
            return `${RangeColor.getColor(oldRating)}⭜${RangeColor.getColor(newRating)}`;
        }
        return `${RangeColor.getColor(oldRating)}⭝${RangeColor.getColor(newRating)}`;
    }
}
