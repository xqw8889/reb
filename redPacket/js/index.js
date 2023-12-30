jQuery(function () {
    const lodashGet = (data, path, defaultValue = 0) => {
        const regPath = path.replace(/\[(\d+)\]/g, '.$1').split('.');
        let result = data;
        for (const path of regPath) {
            result = Object(result)[path];
            if (result == null) {
                return defaultValue;
            }
        }
        return result;
    }

    const redPacketMap = new Map();
    const redPacketContainer = jQuery("#redPacketsContainer");
    const getStyle = (json) =>Object.keys(json).map(v=>`${v}:${json[v]}`).join(';')
    const initializeRedPacketPosition = (redPacket, index) => {
        const randomTime1 = `${Math.random() * 30 + 15}s`;
        const randomTime2 = `${Math.random() * 35 + 15}s`;
        const delay = `${index * -0.02}s `;
        redPacket.attr("style", getStyle({
            "--posvw": `${Math.random() * 85 + 1}vw`,
            "--posvh": `${Math.random() * 85 + 1}vw`,
            "--time": randomTime1,
            "--time2": randomTime2,
            "--delay1": delay,
            "--delay2": delay
        }))
    }

    const createAndAppendRedPacket = (redPacketID, index) => {
        if (redPacketMap.get(redPacketID)) {
            return;
        }

        const redPacket = jQuery(`
            <div class='red-packet red-packet__ani--opening'>
                <img src='../redPacket/asset/demo.jpg'/>
            </div>
        `);

        redPacketMap.set(redPacketID, {
            redPacket,
            use: false
        });

        redPacket.click("click", function (event) {
            if (redPacketMap.get(redPacketID).use) {
                return;
            }

            const x = event.clientX - event.offsetX;
            const y = event.clientY - event.offsetY;
            redPacket.attr("style", getStyle({
                "--x-pos": `${x}px`,
                "--y-pos": `${y}px`,
            }))
            redPacket.removeClass("red-packet__ani--opening");
            redPacket.addClass("red-packet__open--opening");

            redPacketMap.set(redPacketID, {
                redPacket,
                use: true
            });

            const formData = new FormData();
            formData.append("red_packet_id", redPacketID);

            jQuery.ajax({
                "url": "/bank/handle-route",
                type: 'POST',
                data: formData,
                processData: false, // 使数据不做处理
                contentType: false,
            }).done(function (response) {
                const prize = lodashGet(response,'data.prize', null)
                const msg = prize ? `领取成功：${prize.name}（${prize.value}）`: typeof response.data === 'string' ? response.data === 'null' ? '该红包已经抢先被人领走了' : response.data : response.msg
                layui.layer.msg(msg);
                redPacket.remove();
                redPacketMap.delete(redPacketID);
                fetchRedPacketGroups();
            });
        });

        initializeRedPacketPosition(redPacket, index);
        redPacketContainer.append(redPacket);
    }

    const fetchRedPacketGroups = () => {
        jQuery.ajax({
            "url": "/bank/handle",
        }).done(function (response) {
            const data = lodashGet(response, 'data.red_packet_ids', null);
            if (lodashGet(response, 'ret', null) !== '0' ) {
                return
            }
            if (!data) {
                layui.layer.msg('请求接口错误');
                return;
            }
            if (data.length === 0) {
                return;
            }

            // 删除不存在于API响应中的红包
            const existingRedPacketIDs = Array.from(redPacketMap.keys());
            const apiRedPacketIDs = data.map(item => item.id);

            existingRedPacketIDs.forEach(id => {
                if (!apiRedPacketIDs.includes(id)) {
                    const div = redPacketMap.get(id).redPacket;
                    div.remove();
                    redPacketMap.delete(id);
                }
            });

            apiRedPacketIDs.forEach((redPacketID, index) => {
                createAndAppendRedPacket(redPacketID, index);
            });
        });

    }

    fetchRedPacketGroups();
});
