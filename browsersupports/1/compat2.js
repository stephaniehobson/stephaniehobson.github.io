
(function(win, doc, $) {
    'use strict';

    // TODO: don't toggle the cell if they're trying to copy/paste?
        // TODO: add actual close button?
        // TODO: let them click links
    // TODO: avoid scrolling when expanding/collapsing from one to another
    // TODO: collapse tables longer than 2 rows on mobile?
    // TODO: sticky table headers on long desktop/tablet ? Duplicate table header on long tables?
    // TODO: wrap all icons on a row to new line if one cell wraps?


    /*
    Toogle History
    ====================================================================== */


    /*
    Initial setup of DOM
    -------------------------------------------------------------- */

    // creating new element technique copied from http://ejohn.org/apps/workshop/intro/#19
    var $historyLink = $('<a><span></span><i></i></a>')
                       .attr('title', 'View feature history') /* TODO: not #l10n friendly */
                       .addClass('bs-history-link only-icon')
                       .find('i')
                         .attr('aria-hidden', true)
                         .addClass('icon-caret-down')
                       .end();
    var $historySection = $('<section><dl><dt><dd></dd></dt></dl></section>')
                          .addClass('bs-history hidden')
                          .attr('aria-hidden', true)
                          .find('dt')
                            .addClass('bs-supports')
                          .end();
    var historyCount = 0;

    // javascript is enabled, hide the footnotes and legend
    $('.bs-footnotes').hide();
    $('.bs-legend:not(#bs-legend-master)').hide();

    // generate info for cells with no info (legend, no history available, prompt to contribute)
    var $cells = $('.bs-table td');

    $cells.each(function () {

        var $thisCell = $(this);
        // console.log($thisCell);

        // check if it already has a bs-history
        var hasHistory = $thisCell.children('.bs-history').length;
        if (hasHistory < 1) {
            // console.log('no history');
            // if not check for icons
            var $icons = $thisCell.children('.bs-icons');
            var hasIcons = $icons.length;

            if(hasIcons > 0) {
                // console.log('has icons ');

                // change variable indicating if there's a history, since we're adding it
                hasHistory = true;

                // create the history section
                var $thisHistorySection = $historySection.clone();

                // create the history DD
                var $thisHistoryDD = $thisHistorySection.find('dd');

                    // add icon explanations to history
                    $icons.find('abbr').each(function() {
                        var $abbr = $(this);
                        var $newAbbr = $abbr.clone();
                        var isFootnote = $newAbbr.find('.icon-file');

                        // add icon to definition
                        $newAbbr.appendTo($thisHistoryDD);

                        // add defintiion
                        if(isFootnote.length < 1) {
                            // straight forward copy of title if it's not a footnote
                            var title = $newAbbr.attr('title');
                            $thisHistoryDD.append(title);
                        } else {
                            // locate the actual footnote and copy it into the defintion
                            var $thisFootnote = $abbr.parent();
                            var thisFootnoteLink = $thisFootnote.attr('href');
                            var $newFootnote = $(thisFootnoteLink);
                            var definition;
                            // this is either in a dt/dd format or a p, needs to be treated differently
                            if($newFootnote.is('p')) {
                                definition = $newFootnote.html();
                                $thisHistoryDD.append(definition);
                            } else if($newFootnote.is('dt')) {
                                definition = $newFootnote.next('dd').html();
                                $thisHistoryDD.append(definition);
                            } // there's a problem if it's not one of those two :P

                            // once we've got that, remove the anchor from the original
                            $abbr.unwrap();
                        }
                    });

                // create the history DT
                var $thisHistoryDT= $thisHistorySection.find('dt');
                $thisHistoryDT.append($thisCell.html());
                // TODO: copy cell support class

                // create the history link in the cell (do last so not cloned)
                $historyLink.clone().appendTo($thisCell);

                // apend the history section
                $thisHistorySection.appendTo($thisCell);

            } // if(hasIcons)

        } else {
            // already has history, needs to have link href removed so that anchor isn't keyboard focusable
            $thisCell.find('.bs-history-link').removeAttr('href');
            $thisCell.find('.bs-icons a .icon-file').parent().unwrap();
        } // if (hasHistory < 1)

        // TODO? check if it is unknown and add call to contribute?

        // now add listeners if the cell has history
        // doing this seperate from above if because it may have changed
        if(hasHistory > 0) {
            // get history
            var $thisHistory = $thisCell.find('.bs-history');

            // check for ID
            var historyId = $thisHistory.attr('id');

            if(!historyId) {
                console.log('no history ID');
                historyId = 'bs-';
                historyId += historyCount;
                historyCount ++;
                $thisHistory.attr('id', historyId);
            }

            // increase acessability
            $thisCell.attr('tabindex', 0)
                     .attr('aria-expanded', false)
                     .attr('aria-controls', historyId);

            // add event listeners
            $thisCell.on('click touchstart keydown', function(event){ toggleHistory(event, $thisCell); });
        } // if(hasHistory > 0)

    }); // $cells.each()

    /*
    showHistory
    -------------------------------------------------------------- */

    function showHistory($thisCell) {
        // close all open histories
        var $activeCells = $('.bs-table td.active');
        $activeCells.each( function() {
            var $thisActiveCell = $(this);
            hideHistory($thisActiveCell);
        });

        // console.log('show');
        var $thisTable = $thisCell.parents('.bs-table');
        var $thisRow = $thisCell.closest('tr');
        var $thisHistory = $thisCell.children('.bs-history');

        // calculate shape of history
        // we calculate this each time incase the window has been resized

        // measure the width of the table
        var tableWidth = $thisTable.width();
        $thisHistory.outerWidth(tableWidth + 'px');

        // place history on page relative to its cell
        // TODO: is this RTL friendly?!?!

            // get cell coords
            var cellLeft = $thisCell.offset().left;
            // console.log('cellLeft = ' + cellLeft);

            // get cell left border
            var cellLeftBorder = $thisCell.css('border-left-width');

            // get table coords
            var tableLeft = $thisTable.offset().left;
            // console.log('tableLeft = ' + tableLeft);

            // left coord of table minus left coord of cell
            var historyLeft = tableLeft - cellLeft - parseInt(cellLeftBorder);
            // console.log('historyLeft = ' + historyLeft);

            // move history where it will display
            $thisHistory.css('left', historyLeft + 'px');

        // measure height
        $thisHistory.css('display', 'block');
        $thisHistory.attr('aria-hidden', false);
        var historyHeight = $thisHistory.outerHeight();
        // console.log(historyHeight);

        // set max-height to 0 and visibility to visible
        $thisCell.addClass('active');
        $thisCell.attr('aria-expanded', true);
        // need ever so slight a delay here so that browser has applied previous item
        setTimeout(function() {
            $thisHistory.css('height', historyHeight + 'px');
            // add measured height to history and to the cell/row it is being displayed beneath (CSS handles transition)
            if(window.innerWidth > 480) {
                $thisRow.css('border-bottom', historyHeight + 'px solid transparent');
            } else {
                $thisCell.css('border-bottom', historyHeight + 'px solid transparent');
            }
        }, 10);

    }

    /*
    hideHistory
    -------------------------------------------------------------- */

    function hideHistory($thisCell){
        // console.log('hide');

        $thisCell.css('border-bottom', '');
        $thisCell.attr('aria-expanded', false);

        var $thisRow = $thisCell.closest('tr');
        $thisRow.css('border-bottom', '');

        var $thisHistory = $thisCell.children('.bs-history');
        $thisHistory.css('height', '');
        $thisHistory.attr('aria-hidden', true);

        setTimeout(function() {
            $thisCell.removeClass('active');
            $thisHistory.css('display', 'none');
        }, 200);

    }

    /*
    toggleHistory
    -------------------------------------------------------------- */

    function toggleHistory(event, $thisCell) {
        //console.log('toggleHistory');

        if(event.type == 'keydown') {
            if(event.which === 13 || event.which === 32) {
                if($thisCell.hasClass('active')) {
                    hideHistory($thisCell);
                    event.preventDefault();
                    return false;
                } else {
                    showHistory($thisCell);
                    event.preventDefault();
                    return false;
                }
            } else if(event.which === 27) {
                hideHistory($thisCell);
                event.preventDefault();
                return false;
            } else {
                return;
            }
        }

        if($thisCell.hasClass('active')) {
            hideHistory($thisCell);
            event.preventDefault();
            return false;
        } else {
            showHistory($thisCell);
            event.preventDefault();
            return false;
        }

    }


    /*
    Toogle support on smaller viewports if more than 1 row
    ====================================================================== */








})(window, document, jQuery);
